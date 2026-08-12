import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Snackbar, Text } from 'react-native-paper';
import { useState } from 'react';
import { formatAppVersion } from '@/constants/version';

export default function HomeScreen() {
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="GoNext" subtitle={formatAppVersion()} />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Привет, Приветствую в новой разработке!
        </Text>
        <Text variant="bodySmall" style={styles.version}>
          версия: {formatAppVersion()}
        </Text>
        <Button mode="contained" onPress={() => setSnackbarVisible(true)}>
          Нажми меня
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        contentStyle={styles.snackbarContent}
      >
        <Text style={styles.snackbarText}>Кнопка нажата</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    color: '#1C1B1F',
  },
  version: {
    textAlign: 'center',
    color: '#72756e',
  },
  snackbar: {
    justifyContent: 'center',
  },
  snackbarContent: {
    alignItems: 'center',
  },
  snackbarText: {
    textAlign: 'center',
    color: '#FFFFFF',
    width: '100%',
  },
});
