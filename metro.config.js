/**
 * Metro bundler configuration.
 *
 * withNativeWind — post-processes the Tailwind CSS (global.css) and makes
 * the generated styles available to the React Native runtime.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
