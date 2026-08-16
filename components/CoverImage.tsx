import type { ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/components/ThemeContext';

type Props = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Обложка: cover, обрезка сверху, без озвучки скринридером. В тёмной теме картинка скрыта. */
export function CoverImage({ source, style, children }: Props) {
  const { colors, showArtwork } = useAppTheme();
  return (
    <View
      style={[
        styles.clip,
        !showArtwork && { backgroundColor: colors.surfaceMuted },
        style,
      ]}
    >
      {showArtwork ? (
        <Image
          source={source}
          style={styles.img}
          resizeMode="cover"
          accessible={false}
          importantForAccessibility="no"
        />
      ) : null}
      {children ? <View style={styles.content} pointerEvents="box-none">{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    position: 'relative',
  },
  img: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
});
