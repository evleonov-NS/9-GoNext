import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MD3Theme } from 'react-native-paper';
import {
  buildPaperTheme,
  DEFAULT_ACCENT_ID,
  isAccentId,
  paletteFor,
  type AccentId,
  type AppColors,
  type ThemeScheme,
} from '@/constants/theme';

const SCHEME_KEY = 'gonext.themeScheme';
const ACCENT_KEY = 'gonext.themeAccent';

type ThemeContextValue = {
  scheme: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
  accentId: AccentId;
  setAccentId: (accentId: AccentId) => void;
  colors: AppColors;
  paperTheme: MD3Theme;
  isDark: boolean;
  showArtwork: boolean;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ThemeScheme>('light');
  const [accentId, setAccentIdState] = useState<AccentId>(DEFAULT_ACCENT_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([AsyncStorage.getItem(SCHEME_KEY), AsyncStorage.getItem(ACCENT_KEY)])
      .then(([schemeRaw, accentRaw]) => {
        if (cancelled) return;
        if (schemeRaw === 'dark' || schemeRaw === 'light') setSchemeState(schemeRaw);
        if (isAccentId(accentRaw)) setAccentIdState(accentRaw);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setScheme = useCallback((next: ThemeScheme) => {
    setSchemeState(next);
    void AsyncStorage.setItem(SCHEME_KEY, next).catch(() => {});
  }, []);

  const setAccentId = useCallback((next: AccentId) => {
    setAccentIdState(next);
    void AsyncStorage.setItem(ACCENT_KEY, next).catch(() => {});
  }, []);

  const colors = useMemo(() => paletteFor(scheme, accentId), [scheme, accentId]);
  const paperTheme = useMemo(() => buildPaperTheme(scheme, colors), [scheme, colors]);

  const value = useMemo(
    () => ({
      scheme,
      setScheme,
      accentId,
      setAccentId,
      colors,
      paperTheme,
      isDark: scheme === 'dark',
      showArtwork: scheme === 'light',
      hydrated,
    }),
    [scheme, setScheme, accentId, setAccentId, colors, paperTheme, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useThemedStyles<T>(factory: (colors: AppColors) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
