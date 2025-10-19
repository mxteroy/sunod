import { defineConfig } from "@eddeee888/gcg-typescript-resolver-files";
import type { CodegenConfig } from "@graphql-codegen/cli";

const baseConfig = defineConfig({
  resolverTypesPath: "./types.generated.ts",
  resolverMainFile: "./resolvers.generated.ts",
  resolverMainFileMode: "merged",
  typesPluginsConfig: {
    contextType: "@src/auth/context#Context",
    avoidOptionals: true,
    useIndexSignature: true,
    federation: true,
    mappers: {
      User: "@prisma/client#User as PrismaUser",

      // Enums
      UserRole: "@prisma/client#UserRole as PrismaUserRole",
    },
  },
});

// set enumsAsTypes
(baseConfig as any).presetConfig.typesPluginsConfig.enumsAsTypes = true;

const config: CodegenConfig = {
  schema: "src/**/*.graphql",
  ignoreNoDocuments: true,
  generates: {
    "src/schema": baseConfig,
  },
};

export default config;
