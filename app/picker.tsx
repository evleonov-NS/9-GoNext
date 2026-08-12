import { StyleSheet, View } from 'react-native';
import { PlaceRow } from '@/components/cards';
import { StubScreen } from '@/components/StubScreen';

export default function PickerScreen() {
  return (
    <StubScreen
      eyebrow="В идею / поездку"
      title="Выбрать места"
      body="Заготовка picker · выбор placeId без дублей — этапы 4–5."
    >
      <View style={styles.list}>
        <PlaceRow name="Водопад Кивач" city="Карелия" category="nature" />
        <PlaceRow name="Выборгский замок" city="Выборг" category="sight" />
        <PlaceRow name="Горный парк Рускеала" city="Карелия" category="nature" />
      </View>
    </StubScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 9,
  },
});
