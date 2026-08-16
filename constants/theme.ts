import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export type ThemeScheme = 'light' | 'dark';

/** Палитра из иллюстрации (assets/INTEGRATION_PROMPT.md) + тёмный вариант. */
export type AppColors = {
  accent: string;
  accentDark: string;
  accentHover: string;
  accentMuted: string;
  accentSoft: string;
  accentRing: string;

  bg: string;
  bgOuter: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  dashed: string;
  handle: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textStrong: string;
  textOnAccent: string;
  textOnGold: string;

  gold: string;
  terracotta: string;
  terracottaMid: string;
  ridges: string;
  sky: string;

  onHeroEyebrow: string;
  onHeroText: string;

  glassBg: string;
  glassBorder: string;

  overlay: string;

  hintBg: string;
  hintBorder: string;
  hintAccent: string;
  hintText: string;
  hintButton: string;
  hintChip: string;

  diaryBgTop: string;
  diaryChipBg: string;
  diaryChipFg: string;
  diaryTitle: string;

  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  heartActiveBg: string;
  heartActiveBorder: string;
  heartActiveFg: string;
  tabBarBg: string;
};

export const lightColors: AppColors = {
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

  dangerBg: '#fdf6f5',
  dangerBorder: '#f0d4d0',
  dangerText: '#b42318',
  heartActiveBg: '#fdeef2',
  heartActiveBorder: '#f0d4dc',
  heartActiveFg: '#8d3f57',
  tabBarBg: 'rgba(255,255,255,0.94)',
};

/** Ночной фон #161a17, стекло rgba(24,28,24,0.72) — INTEGRATION_PROMPT §5. */
export const darkColors: AppColors = {
  accent: '#7da88a',
  accentDark: '#9ec3a8',
  accentHover: '#6d9078',
  accentMuted: '#243028',
  accentSoft: '#1e2a22',
  accentRing: 'rgba(125,168,138,0.32)',

  bg: '#161a17',
  bgOuter: '#121512',
  surface: '#1e2420',
  surfaceMuted: '#1a211c',
  border: '#2c3830',
  borderStrong: '#3a4a40',
  dashed: '#3a4a40',
  handle: '#4a5a50',

  text: '#eee8dc',
  textSecondary: '#9aa394',
  textMuted: '#8a9288',
  textStrong: '#f2eee4',
  textOnAccent: '#ffffff',
  textOnGold: '#3a2c0d',

  gold: '#edb63f',
  terracotta: '#d9814a',
  terracottaMid: '#e09a68',
  ridges: '#8f9bbd',
  sky: '#3a4658',

  onHeroEyebrow: '#9aa394',
  onHeroText: '#eee8dc',

  glassBg: 'rgba(24,28,24,0.72)',
  glassBorder: 'rgba(255,255,255,0.12)',

  overlay: 'rgba(0,0,0,0.55)',

  hintBg: '#243028',
  hintBorder: '#3a4a40',
  hintAccent: '#edb63f',
  hintText: '#c4b8a0',
  hintButton: '#a4652c',
  hintChip: '#3a4a40',

  diaryBgTop: '#161a17',
  diaryChipBg: '#2a332c',
  diaryChipFg: '#edb63f',
  diaryTitle: '#eee8dc',

  dangerBg: '#2c1c1b',
  dangerBorder: '#5c3330',
  dangerText: '#f0a8a0',
  heartActiveBg: '#3a242c',
  heartActiveBorder: '#5c3a44',
  heartActiveFg: '#e8a0b4',
  tabBarBg: 'rgba(24,28,24,0.94)',
};

const fontConfig = configureFonts({
  config: {
    fontFamily: 'System',
  },
});

export function paletteFor(scheme: ThemeScheme): AppColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function buildPaperTheme(scheme: ThemeScheme, palette: AppColors): MD3Theme {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    fonts: fontConfig,
    roundness: 16,
    colors: {
      ...base.colors,
      primary: palette.accent,
      primaryContainer: palette.accentMuted,
      onPrimary: palette.textOnAccent,
      onPrimaryContainer: palette.accentDark,
      secondary: palette.hintButton,
      secondaryContainer: palette.hintBg,
      onSecondary: palette.textOnAccent,
      onSecondaryContainer: palette.hintText,
      background: palette.bg,
      surface: palette.surface,
      surfaceVariant: palette.surfaceMuted,
      onBackground: palette.text,
      onSurface: palette.text,
      onSurfaceVariant: palette.textSecondary,
      outline: palette.border,
      outlineVariant: palette.dashed,
      error: palette.dangerText,
      elevation: {
        ...base.colors.elevation,
        level0: 'transparent',
        level1: palette.surface,
        level2: palette.surface,
        level3: palette.surface,
        level4: palette.surface,
        level5: palette.surface,
      },
    },
  };
}

export const theme: MD3Theme = buildPaperTheme('light', lightColors);

/** Светлая палитра по умолчанию. В UI брать `useAppTheme().colors`. */
export const colors = lightColors;

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
