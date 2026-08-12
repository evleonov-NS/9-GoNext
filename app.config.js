const { __version__ } = require('./constants/version');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'GoNext',
  slug: 'gonext',
  version: __version__,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gonext',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: '#E6F4FE',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    // static — COEP/COOP заголовки Metro попадают и на HTML (нужно для expo-sqlite web)
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: ['expo-router', 'expo-sqlite', '@react-native-community/datetimepicker'],
  experiments: {
    typedRoutes: true,
  },
};
