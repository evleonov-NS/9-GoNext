import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  height: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const STEPS = 36;

/**
 * Растворение картинки в фон экрана: полосы одного цвета с растущей альфой.
 * Своя реализация вместо expo-linear-gradient — как LinearGradientPlaceholder.
 */
export function FadeToBackground({ height, color = colors.bg, style }: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, { height }, style]}>
      {Array.from({ length: STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
            opacity: Math.pow((i + 1) / STEPS, 1.8),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
