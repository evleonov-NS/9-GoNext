import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/chrome';
import { CoverImage } from '@/components/CoverImage';
import { Screen } from '@/components/Screen';
import { artwork } from '@/constants/artwork';
import { useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';

export default function DiaryScreen() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen contentStyle={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.chip}>
          <Text style={styles.chipText}>{t('diary.chip')}</Text>
        </View>
      </View>
      <CoverImage source={artwork.cover} style={styles.cover} />
      <Text style={styles.title}>{t('diary.title')}</Text>
      <Text style={styles.sub}>{t('diary.sub')}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('diary.day1')}</Text>
        <Text style={styles.cardBody}>{t('diary.body')}</Text>
      </View>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  root: {
    backgroundColor: colors.diaryBgTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  cover: {
    height: 160,
    borderRadius: radii.card,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.diaryChipBg,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.diaryChipFg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1.2,
    color: colors.diaryTitle,
  },
  sub: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 13.5,
    color: colors.hintText,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hintChip,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.diaryTitle,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.hintText,
  },
  });
}
