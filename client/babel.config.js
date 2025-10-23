module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@shared": "../shared",
          },
          extensions: [".tsx", ".ts", ".js", ".json"],
        },
      ],
      "relay",
      "@babel/plugin-proposal-export-namespace-from",
      // 👇 keep this last for Reanimated
      "react-native-reanimated/plugin",
    ],
  };
};
