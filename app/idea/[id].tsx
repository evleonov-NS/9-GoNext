import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BackButton, ErrorState } from '@/components/chrome';
import { IdeaPlaceSheet } from '@/components/IdeaPlaceSheet';
import { CoverImage } from '@/components/CoverImage';
import { Screen } from '@/components/Screen';
import { artwork } from '@/constants/artwork';
import {
  ideaStatusLabel,
  PLACE_PRIORITIES,
} from '@/constants/priorities';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import { useTripIdea, type IdeaPlaceRow } from '@/hooks/useTripIdea';
import type { PlacePriority } from '@/types';
import { pluralPlaces } from '@/utils/plural';

export default function IdeaCardScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useTranslation();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idParam ? Number(idParam) : null;
  const {
    idea,
    places,
    loading,
    error,
    updatePlace,
    movePlace,
    removePlace,
    refresh,
  } = useTripIdea(id);

  const [sheetItem, setSheetItem] = useState<IdeaPlaceRow | null>(null);

  const sheetIndex = useMemo(
    () => (sheetItem ? places.findIndex((p) => p.id === sheetItem.id) : -1),
    [places, sheetItem]
  );

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!idea) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
        </View>
        <ErrorState
          message={error ?? t('alerts.ideaNotFound')}
          onRetry={() => void refresh()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t('idea.badge', { status: ideaStatusLabel(idea.status) })}
          </Text>
        </View>
      </View>

      <CoverImage source={artwork.cover} style={styles.cover} />

      <Text style={styles.title}>{idea.title}</Text>
      {idea.description ? <Text style={styles.desc}>{idea.description}</Text> : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{t('idea.wantVisit')}</Text>
        <Text style={styles.sectionMeta}>{pluralPlaces(places.length)}</Text>
      </View>

      <View style={styles.listCard}>
        {places.length === 0 ? (
          <Text style={styles.emptyList}>{t('idea.emptyList')}</Text>
        ) : (
          places.map((row, index) => {
            const catShort = t(`categoryShort.${row.place.category}`);
            const prio = PLACE_PRIORITIES[row.priority];
            const sub = row.place.city
              ? `${row.place.city} · ${catShort.toLowerCase()}`
              : catShort;
            return (
              <Pressable
                key={row.id}
                style={[styles.placeRow, index > 0 && styles.placeRowSep]}
                onPress={() => setSheetItem(row)}
              >
                <CategoryIcon category={row.place.category} size={40} />
                <View style={styles.placeText}>
                  <Text style={styles.placeName}>{row.place.name}</Text>
                  <Text style={styles.placeMeta}>
                    {sub}
                    {row.notes ? ` · ${row.notes}` : ''}
                  </Text>
                </View>
                <View style={[styles.prio, { backgroundColor: prio.bg }]}>
                  <Text style={[styles.prioText, { color: prio.fg }]}>
                    {t(`priority.${row.priority}`)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Pressable
        style={styles.addBtn}
        onPress={() =>
          router.push({
            pathname: '/picker',
            params: { mode: 'idea', ideaId: String(idea.id) },
          })
        }
      >
        <Text style={styles.addBtnText}>{t('idea.addPlace')}</Text>
      </Pressable>

      <Pressable
        style={idea.status === 'converted' ? styles.secondary : styles.primary}
        onPress={() =>
          router.push({
            pathname: '/form/trip',
            params: { ideaId: String(idea.id) },
          })
        }
      >
        <Text
          style={
            idea.status === 'converted' ? styles.secondaryText : styles.primaryText
          }
        >
          {idea.status === 'converted'
            ? t('idea.createAnotherTrip')
            : t('idea.createTrip')}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.editBtn}
          onPress={() =>
            router.push({ pathname: '/form/idea', params: { id: String(idea.id) } })
          }
        >
          <Text style={styles.editBtnText}>{t('idea.edit')}</Text>
        </Pressable>
      </View>

      <IdeaPlaceSheet
        item={sheetItem}
        visible={sheetItem != null}
        canMoveUp={sheetIndex > 0}
        canMoveDown={sheetIndex >= 0 && sheetIndex < places.length - 1}
        onClose={() => setSheetItem(null)}
        onChangePriority={(priority: PlacePriority) => {
          if (!sheetItem) return;
          void updatePlace(sheetItem.id, { priority }).then(() => {
            setSheetItem((prev) => (prev ? { ...prev, priority } : prev));
          });
        }}
        onSaveNotes={(notes) => {
          if (!sheetItem) return;
          void updatePlace(sheetItem.id, { notes }).then(() => {
            setSheetItem((prev) => (prev ? { ...prev, notes } : prev));
          });
        }}
        onMove={(direction) => {
          if (!sheetItem) return;
          void movePlace(sheetItem.id, direction);
        }}
        onRemove={() => {
          if (!sheetItem) return;
          const name = sheetItem.place.name;
          const linkId = sheetItem.id;
          Alert.alert(
            t('alerts.removeFromIdeaTitle'),
            t('alerts.removeFromIdeaBody', { name }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('alerts.remove'),
                style: 'destructive',
                onPress: () => {
                  setSheetItem(null);
                  void removePlace(linkId);
                },
              },
            ]
          );
        }}
        onOpenPlace={() => {
          if (!sheetItem) return;
          const placeId = sheetItem.place.id;
          setSheetItem(null);
          router.push({ pathname: '/place/[id]', params: { id: String(placeId) } });
        }}
      />
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.diaryChipBg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.diaryChipFg,
  },
  cover: {
    height: 160,
    borderRadius: radii.card,
  },
  title: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.text,
  },
  desc: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  sectionRow: {
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  emptyList: {
    paddingVertical: 18,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
  },
  placeRowSep: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeText: {
    flex: 1,
  },
  placeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  placeMeta: {
    marginTop: 4,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  prio: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
    maxWidth: 110,
  },
  prioText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  addBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.textSecondary,
  },
  primary: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.textOnAccent,
  },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.text,
  },
  actions: {
    marginTop: 16,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    fontWeight: '800',
    color: colors.text,
  },
  });
}
