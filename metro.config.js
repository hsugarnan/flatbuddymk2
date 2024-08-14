// // Learn more https://docs.expo.io/guides/customizing-metro
// const { getDefaultConfig } = require('expo/metro-config');

// /** @type {import('expo/metro-config').MetroConfig} */
// const config = getDefaultConfig(__dirname);

// module.exports = config;
const { getDefaultConfig } = require('expo/metro-config');

// Get the default config from Expo
const config = getDefaultConfig(__dirname);

// Extend the default config
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg', 'gif'],
};

// Export the config
module.exports = config;
