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
    image: './assets/gonext-bg-1080x1920.png',
    resizeMode: 'cover',
    backgroundColor: '#faf4e9',
  },
  ios: {
    supportsTablet: true,
    splash: {
      image: './assets/gonext-bg-1290x2796.png',
      resizeMode: 'cover',
      backgroundColor: '#faf4e9',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundColor: '#faf4e9',
    },
    edgeToEdgeEnabled: true,
    splash: {
      image: './assets/gonext-bg-1080x1920.png',
      resizeMode: 'cover',
      backgroundColor: '#faf4e9',
    },
  },
  web: {
    bundler: 'metro',
    // static — COEP/COOP заголовки Metro попадают и на HTML (нужно для expo-sqlite web)
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    '@react-native-community/datetimepicker',
    [
      'expo-image-picker',
      {
        photosPermission: 'GoNext сохраняет выбранные фото к местам и посещениям.',
        cameraPermission: 'GoNext использует камеру, чтобы добавить фото к месту или посещению.',
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};
