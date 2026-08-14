import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, ImageBackground, Platform, StyleSheet } from 'react-native';
import { PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { AddSheetProvider } from '@/components/AddSheetContext';
import { artwork } from '@/constants/artwork';
import { DATABASE_NAME, initializeDatabase } from '@/database';
import { colors, theme } from '@/constants/theme';

function DbLoading() {
  const source = Platform.OS === 'ios' ? artwork.bgIos : artwork.bgAndroid;
  return (
    <ImageBackground source={source} style={styles.boot} resizeMode="cover">
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.bootText}>Открываем базу…</Text>
    </ImageBackground>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Suspense fallback={<DbLoading />}>
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            onInit={initializeDatabase}
            useSuspense
          >
            <AddSheetProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
