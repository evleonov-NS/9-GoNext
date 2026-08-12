import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ACTIONS = [
  { label: '＋  Куда хочу поехать', href: '/form/idea' as const },
  { label: '＋  Что хочу посетить', href: '/form/place' as const },
  { label: '＋  Новую поездку', href: '/form/trip' as const },
];

export function AddSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const go = (href: (typeof ACTIONS)[number]['href']) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Что добавить?</Text>
          <Text style={styles.sub}>
            Один быстрый вход вместо отдельных форм.
          </Text>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.href}
              style={styles.action}
              onPress={() => go(action.href)}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 18,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -16 },
    elevation: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.handle,
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  sub: {
    marginTop: 7,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  action: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginTop: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
});
