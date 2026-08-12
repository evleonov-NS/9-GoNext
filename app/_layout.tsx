import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AddSheetProvider } from '@/components/AddSheetContext';
import { theme } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AddSheetProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
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
      </PaperProvider>
    </SafeAreaProvider>
  );
}
