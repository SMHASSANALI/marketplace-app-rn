/**
 * Babel configuration for Expo + NativeWind v4.
 *
 * Key settings:
 *  - jsxImportSource: 'nativewind'  — enables className prop on every RN component
 *  - nativewind/babel plugin         — transforms Tailwind class names at build time
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
  };
};
