/**
 * @generated SignedSource<<93b80bfb562da05f2a7082cdd7c67bb5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TestDemoSpaceEventsSubscription$variables = Record<PropertyKey, never>;
export type TestDemoSpaceEventsSubscription$data = {
  readonly demoSpaceEvents: any;
};
export type TestDemoSpaceEventsSubscription = {
  response: TestDemoSpaceEventsSubscription$data;
  variables: TestDemoSpaceEventsSubscription$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "demoSpaceEvents",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "TestDemoSpaceEventsSubscription",
    "selections": (v0/*: any*/),
    "type": "Subscription",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "TestDemoSpaceEventsSubscription",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "3bcf601ca57bae988cbfbed28dd47c0c",
    "id": null,
    "metadata": {},
    "name": "TestDemoSpaceEventsSubscription",
    "operationKind": "subscription",
    "text": "subscription TestDemoSpaceEventsSubscription {\n  demoSpaceEvents\n}\n"
  }
};
})();

(node as any).hash = "e2b27aacbcb9ecbc0f77dafe0f638a47";

export default node;
