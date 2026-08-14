import { MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/** Палитра из иллюстрации (assets/INTEGRATION_PROMPT.md). */
export const colors = {
  accent: '#3f5c46',
  accentDark: '#2d4233',
  accentHover: '#334a39',
  accentMuted: '#e5eee7',
  accentSoft: '#e8f1ea',
  accentRing: 'rgba(63,92,70,0.22)',

  bg: '#faf4e9',
  bgOuter: '#f0e5d1',
  surface: '#ffffff',
  surfaceMuted: '#f6eee0',
  border: '#f0e5d1',
  borderStrong: '#e6d7c0',
  dashed: '#e6d7c0',
  handle: '#dccbb0',

  text: '#2b2519',
  textSecondary: '#9b8a70',
  textMuted: '#9b8a70',
  textStrong: '#26313f',
  textOnAccent: '#ffffff',
  textOnGold: '#3a2c0d',

  gold: '#edb63f',
  terracotta: '#a4652c',
  terracottaMid: '#d9814a',
  ridges: '#8f9bbd',
  sky: '#cfdcf0',

  onHeroEyebrow: '#5d6b7d',
  onHeroText: '#26313f',

  glassBg: 'rgba(255,255,255,0.82)',
  glassBorder: 'rgba(255,255,255,0.9)',

  overlay: 'rgba(20,22,20,0.36)',

  hintBg: '#fdf6ec',
  hintBorder: '#f0e2cd',
  hintAccent: '#a1743a',
  hintText: '#8a7458',
  hintButton: '#a4652c',
  hintChip: '#ecdcc4',

  diaryBgTop: '#faf4e9',
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
