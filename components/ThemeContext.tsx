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
  paletteFor,
  type AppColors,
  type ThemeScheme,
} from '@/constants/theme';

const STORAGE_KEY = 'gonext.themeScheme';

type ThemeContextValue = {
  scheme: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
  colors: AppColors;
  paperTheme: MD3Theme;
  isDark: boolean;
  showArtwork: boolean;
  hydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ThemeScheme>('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw === 'dark' || raw === 'light') setSchemeState(raw);
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
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const colors = paletteFor(scheme);
  const paperTheme = useMemo(() => buildPaperTheme(scheme, colors), [scheme, colors]);

  const value = useMemo(
    () => ({
      scheme,
      setScheme,
      colors,
      paperTheme,
      isDark: scheme === 'dark',
      showArtwork: scheme === 'light',
      hydrated,
    }),
    [scheme, setScheme, colors, paperTheme, hydrated]
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
