import { StyleSheet, View } from 'react-native';
import { IconPath } from '@/components/IconPath';
import {
  PLACE_CATEGORIES,
  type PlaceCategoryId,
} from '@/constants/categories';

type Props = {
  category: PlaceCategoryId;
  size?: number;
};

export function CategoryIcon({ category, size = 40 }: Props) {
  const cat = PLACE_CATEGORIES[category];
  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.35),
          backgroundColor: cat.bg,
        },
      ]}
    >
      <IconPath d={cat.path} size={iconSize} color={cat.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
