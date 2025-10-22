const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Define the project root and shared folder paths
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const sharedFolder = path.resolve(workspaceRoot, "shared");

// Add the shared directory to the watchFolders
config.watchFolders = [sharedFolder];

// Configure the resolver to handle the shared module
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.alias = {
  "@shared": sharedFolder,
  "@": projectRoot,
};

// Ensure TypeScript and WASM files are properly resolved
config.resolver.sourceExts.push("js", "ts", "tsx");
config.resolver.assetExts.push("wasm");

// Ensure proper platform extensions
config.resolver.platforms = ["ios", "android", "web", "native"];

// Exclude Node.js standard library modules that aren't available in React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block Node.js built-in modules
  if (
    moduleName === "fs" ||
    moduleName === "path" ||
    moduleName === "crypto" ||
    moduleName === "stream" ||
    moduleName === "http" ||
    moduleName === "https" ||
    moduleName === "os" ||
    moduleName === "url"
  ) {
    return {
      type: "empty",
    };
  }

  // Let Metro handle everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
