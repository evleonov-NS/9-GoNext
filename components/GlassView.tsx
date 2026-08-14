import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii } from '@/constants/theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const webBlur =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      } as ViewStyle)
    : null;

/** Стеклянная плашка поверх hero: полупрозрачный белый + blur на web. */
export function GlassView({ children, style }: Props) {
  return <View style={[styles.glass, webBlur, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
});
