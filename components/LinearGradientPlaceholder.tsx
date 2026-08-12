import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  colors: [string, string];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Плейсхолдер градиентной обложки без expo-linear-gradient:
 * два перекрывающихся слоя имитируют linear-gradient(140deg, …).
 */
export function LinearGradientPlaceholder({
  colors: [from, to],
  style,
  children,
}: Props) {
  return (
    <View style={[styles.base, { backgroundColor: from }, style]}>
      <View style={[styles.overlay, { backgroundColor: to }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
    transform: [{ rotate: '12deg' }, { scale: 1.35 }],
    left: '20%',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
});
