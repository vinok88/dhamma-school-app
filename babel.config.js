module.exports = function (api) {
  // Detect Jest so we can skip the NativeWind / css-interop transforms which
  // inject helpers that confuse jest.mock() factories.
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    return {
      presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
      plugins: ['react-native-reanimated/plugin'],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      require('react-native-css-interop/dist/babel-plugin').default,
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic', importSource: 'react-native-css-interop' }],
      'react-native-reanimated/plugin',
    ],
  };
};
