const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withUniwindConfig} = require('uniwind/metro');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
  },
};

// withUniwindConfig MUST be the outermost wrapper
module.exports = withUniwindConfig(
  wrapWithReanimatedMetroConfig(
    mergeConfig(getDefaultConfig(__dirname), config),
  ),
  {
    cssEntryFile: './global.css',
    dtsFile: './src/uniwind.d.ts',
  },
);
