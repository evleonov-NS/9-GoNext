import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, ImageBackground, Platform, StyleSheet, View } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { AddSheetProvider } from '@/components/AddSheetContext';
import { ThemeProvider, useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { artwork } from '@/constants/artwork';
import { DATABASE_NAME, initializeDatabase } from '@/database';
import type { AppColors } from '@/constants/theme';

function DbLoading() {
  const { colors, showArtwork } = useAppTheme();
  const styles = useThemedStyles(createBootStyles);
  const source = Platform.OS === 'ios' ? artwork.bgIos : artwork.bgAndroid;
  if (!showArtwork) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.bootText}>Открываем базу…</Text>
      </View>
    );
  }
  return (
    <ImageBackground source={source} style={styles.boot} resizeMode="cover">
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.bootText}>Открываем базу…</Text>
    </ImageBackground>
  );
}

function AppShell() {
  const { paperTheme, colors, isDark, hydrated } = useAppTheme();
  const styles = useThemedStyles(createBootStyles);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <Suspense fallback={<DbLoading />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={initializeDatabase}
          useSuspense
        >
          <AddSheetProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="next" />
              <Stack.Screen name="diary" />
              <Stack.Screen name="picker" />
              <Stack.Screen name="place/[id]" />
              <Stack.Screen name="idea/[id]" />
              <Stack.Screen name="trip/[id]" />
              <Stack.Screen name="form/place" />
              <Stack.Screen name="form/idea" />
              <Stack.Screen name="form/trip" />
            </Stack>
          </AddSheetProvider>
        </SQLiteProvider>
      </Suspense>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function createBootStyles(colors: AppColors) {
  return StyleSheet.create({
    boot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.bg,
    },
    bootText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
