module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reanimated 4: the Babel plugin moved to react-native-worklets and must be listed last.
    'react-native-worklets/plugin',
  ]
};
