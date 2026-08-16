import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';

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
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.glass, webBlur, style]}>{children}</View>;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    glass: {
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radii.sm,
      overflow: 'hidden',
    },
  });
}
