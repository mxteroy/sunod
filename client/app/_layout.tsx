import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { authToken } from "@/core/auth/authToken";
import { getJwtExpSeconds } from "@/core/auth/tokenExpiry";
import { ThemeProvider } from "@/core/theme/ThemeContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from "@expo-google-fonts/space-mono";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import reactRelay from "react-relay";
import {
  Environment,
  FetchFunction,
  GraphQLResponse,
  Network,
  Observable,
  RecordSource,
  RequestParameters,
  Store,
  SubscribeFunction,
  Variables,
} from "relay-runtime";

export const unstable_settings = {
  anchor: "(tabs)",
};

const RelayEnvironmentProvider =
  reactRelay.RelayEnvironmentProvider as unknown as (props: {
    children: React.ReactNode;

    environment: Environment;
  }) => React.ReactElement;

export default function App() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  if (!loaded) return null;

  return (
    <RelayEnvironmentProvider environment={relayEnv}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <Stack>
              <Stack.Screen name="(test)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </RelayEnvironmentProvider>
  );
}

// TODO: Move this to an env file
const GRAPHQL_API_URL = "http://localhost:3001/graphql";

let refreshInFlight: Promise<string | null> | null = null;

async function tryParseJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { errors: [{ message: text || res.statusText }] };
  }
}

const fetchGraphQL: FetchFunction = async (
  request: RequestParameters,
  variables: Variables,
  _cacheConfig,
  uploadables
): Promise<GraphQLResponse> => {
  const makeBodyAndHeaders = () => {
    const headers: Record<string, string> = {};
    const access = authToken.get();
    if (access) headers.Authorization = `Bearer ${access}`;

    if (uploadables) {
      const form = new FormData();
      if (request.text) form.append("query", request.text);
      if (request.id) form.append("id", request.id);
      form.append("variables", JSON.stringify(variables));
      Object.entries(uploadables as Record<string, any>).forEach(([k, v]) => {
        form.append(k, v as any);
      });
      return { body: form as BodyInit, headers: headers as HeadersInit };
    }

    return {
      body: JSON.stringify({
        query: request.text ?? null,
        id: request.id ?? null,
        variables,
      }),
      headers: { "Content-Type": "application/json", ...headers },
    };
  };

  const doRefresh = async () => {
    const r = await fetch(GRAPHQL_API_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "mutation { refreshSession { accessToken } }",
      }),
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    const tok = j?.data?.refreshSession?.accessToken as string | undefined;
    if (tok) {
      authToken.set(tok);
    }
    return tok ?? null;
  };

  const doFetch = async () => {
    // proactive refresh if expiring in <60s. This way, there's no need to wait for a 401 error from the server.
    // This is a simple optimization to avoid a 401 error in the first place.
    const current = authToken.get();
    const exp = current ? getJwtExpSeconds(current) : null;
    if (exp && exp * 1000 - Date.now() < 60_000) {
      await (refreshInFlight ??
        (refreshInFlight = doRefresh().finally(() =>
          setTimeout(() => {
            refreshInFlight = null;
          }, 0)
        )));
    }
    const { body, headers } = makeBodyAndHeaders();
    return fetch(GRAPHQL_API_URL, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });
  };

  let res = await doFetch();

  if (res.status === 401) {
    // Single-flight refresh to avoid a thundering herd
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const r = await fetch(GRAPHQL_API_URL, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "mutation { refreshSession { accessToken } }",
          }),
        });
        if (!r.ok) return null;
        const j = await r.json().catch(() => null);
        const token = j?.data?.refreshSession?.accessToken as
          | string
          | undefined;
        if (token) {
          authToken.set(token);
          return token;
        }
        return null;
      })().finally(() => {
        // let other awaiters read the resolved value first
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      });
    }

    const refreshed = await refreshInFlight;
    if (refreshed) {
      res = await doFetch(); // retry once with new access token
    }
  }

  // Let Relay handle { data, errors }, but be defensive about non-JSON responses
  return tryParseJson(res) as Promise<GraphQLResponse>;
};

// Subscription function for WebSocket connections
const subscribeGraphQL: SubscribeFunction = (
  request: RequestParameters,
  variables: Variables
) => {
  return Observable.create((sink) => {
    // Lazy load graphql-ws to avoid SSR issues
    import("graphql-ws").then(({ createClient }) => {
      const client = createClient({
        url: "ws://localhost:3001/graphql",
      });

      const unsubscribe = client.subscribe(
        {
          query: request.text ?? "",
          variables,
        },
        {
          next: (data: any) => sink.next(data as GraphQLResponse),
          error: (err: any) => sink.error(err),
          complete: () => {
            sink.complete();
            client.dispose();
          },
        }
      );

      // Return cleanup function
      return () => {
        unsubscribe();
        client.dispose();
      };
    });
  });
};

export const relayEnv = new Environment({
  network: Network.create(fetchGraphQL, subscribeGraphQL),
  store: new Store(new RecordSource()),
});
