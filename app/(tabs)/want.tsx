import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IdeaCard } from '@/components/cards';
import { PlaceRow } from '@/components/cards';
import { Screen } from '@/components/Screen';
import { FilterChip, PageTitle, SectionHeader } from '@/components/ui';
import { colors, radii } from '@/constants/theme';

const WANT_TABS = ['Направления', 'Что посетить'] as const;

export default function WantScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof WANT_TABS)[number]>('Направления');
  const [search, setSearch] = useState('');

  return (
    <Screen tabBarPadding>
      <PageTitle eyebrow="Планы без обязательств" title="Хочу" />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти направление или место"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />
      <View style={styles.chips}>
        {WANT_TABS.map((label) => (
          <FilterChip
            key={label}
            label={label}
            active={tab === label}
            onPress={() => setTab(label)}
          />
        ))}
      </View>

      {tab === 'Направления' ? (
        <View style={styles.grid}>
          <IdeaCard
            title="Алтай"
            sub="Горы и озёра · активная идея"
            countLabel="5 мест"
            cover={['#3a6b4d', '#9dc3aa']}
            onPress={() =>
              router.push({ pathname: '/idea/[id]', params: { id: 'altai' } })
            }
          />
          <IdeaCard
            title="Стамбул"
            sub="Город на два континента"
            countLabel="6 мест"
            cover={['#8b5a2b', '#d9ab7c']}
            onPress={() =>
              router.push({ pathname: '/idea/[id]', params: { id: 'istanbul' } })
            }
          />
        </View>
      ) : (
        <View style={styles.list}>
          <SectionHeader title="Хочу посетить" />
          <PlaceRow
            name="Кижи"
            city="Карелия"
            category="museum"
            onPress={() =>
              router.push({ pathname: '/place/[id]', params: { id: 'kizhi' } })
            }
          />
          <PlaceRow
            name="Парк Монрепо"
            city="Выборг"
            category="walk"
            onPress={() =>
              router.push({ pathname: '/place/[id]', params: { id: 'monrepo' } })
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  list: {
    gap: 10,
  },
});
