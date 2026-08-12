import { MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/** Токены палитры из docs/reference/gonext_prototype.html */
export const colors = {
  accent: '#2f6d58',
  accentDark: '#254f41',
  accentHover: '#22503d',
  accentMuted: '#e5f0ea',
  accentSoft: '#e8f1ea',
  accentRing: 'rgba(47,109,88,0.22)',

  bg: '#f5f5f2',
  bgOuter: '#e8e9e5',
  surface: '#ffffff',
  surfaceMuted: '#eef0ec',
  border: '#e6e7e1',
  borderStrong: '#dfe1da',
  dashed: '#d8dad1',
  handle: '#d0d1cc',

  text: '#171817',
  textSecondary: '#72756e',
  textMuted: '#8a8d84',
  textStrong: '#45483f',
  textOnAccent: '#ffffff',

  overlay: 'rgba(20,22,20,0.36)',

  hintBg: '#fdf6ec',
  hintBorder: '#f0e2cd',
  hintAccent: '#a1743a',
  hintText: '#8a7458',
  hintButton: '#a9622c',
  hintChip: '#ecdcc4',

  diaryBgTop: '#faf2e7',
  diaryChipBg: '#f2e2cd',
  diaryChipFg: '#8a5c25',
  diaryTitle: '#3b2d1d',
} as const;

const fontConfig = configureFonts({
  config: {
    fontFamily: 'System',
  },
});

export const theme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.accent,
    primaryContainer: colors.accentMuted,
    onPrimary: colors.textOnAccent,
    onPrimaryContainer: colors.accentDark,
    secondary: colors.hintButton,
    secondaryContainer: colors.hintBg,
    onSecondary: colors.textOnAccent,
    onSecondaryContainer: colors.hintText,
    background: colors.bg,
    surface: colors.surface,
    surfaceVariant: colors.surfaceMuted,
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.dashed,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
};

export const radii = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  card: 26,
  sheet: 28,
  pill: 999,
  fab: 19,
} as const;
