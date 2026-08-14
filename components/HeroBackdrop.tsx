import { Image, StyleSheet, View } from 'react-native';
import { FadeToBackground } from '@/components/FadeToBackground';
import { artwork } from '@/constants/artwork';
import { heroFadeHeight } from '@/utils/heroLayout';

type Props = {
  width: number;
  height: number;
};

/** Иллюстрация за шапкой: cover сверху + растворение в фон, стыка не видно. */
export function HeroBackdrop({ width, height }: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, { width, height }]}>
      <Image
        source={artwork.hero}
        style={{ width, height }}
        resizeMode="cover"
        accessible={false}
        importantForAccessibility="no"
      />
      <FadeToBackground height={heroFadeHeight(height)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
});
