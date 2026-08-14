import type { ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Обложка: cover, обрезка сверху, без озвучки скринридером. */
export function CoverImage({ source, style, children }: Props) {
  return (
    <View style={[styles.clip, style]}>
      <Image
        source={source}
        style={styles.img}
        resizeMode="cover"
        accessible={false}
        importantForAccessibility="no"
      />
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
