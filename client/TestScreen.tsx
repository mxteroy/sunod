// Test file to verify our Text and Button components work
import type { SpaceDoc } from "@shared/schema";
import React from "react";
import { View } from "react-native";
import SpaceRenderer from "./core/renderer/Renderer";

const testDoc: SpaceDoc = {
  id: "test-space",
  sharedValues: [
    { id: "textOpacity", t: "number", initial: 1 },
    { id: "buttonPressed", t: "boolean", initial: false },
  ],
  root: {
    type: "View",
    id: "root",
    style: {
      flex: 1,
      padding: 20,
      backgroundColor: "#1a1a2e",
    },
    children: [
      {
        type: "Text",
        id: "test-text",
        text: "🎉 Text Component Works!",
        style: {
          margin: 16,
          backgroundColor: "rgba(106, 90, 205, 0.3)",
          padding: 12,
          borderRadius: 8,
          opacity: { bind: { type: "shared", ref: "textOpacity" } },
        },
      },
      {
        type: "Button",
        id: "test-button",
        text: "Glass Button Works!",
        glassEffect: true,
        onPress: "test-action",
        style: {
          width: 200,
          height: 60,
          borderRadius: 16,
          margin: 16,
          backgroundColor: "rgba(34, 211, 238, 0.2)",
        },
      },
    ],
  },
};

export default function TestScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SpaceRenderer doc={testDoc} />
    </View>
  );
}
