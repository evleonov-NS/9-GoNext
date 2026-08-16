import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Snackbar, Text } from 'react-native-paper';
import { IconPath } from '@/components/IconPath';
import { LinearGradientPlaceholder } from '@/components/LinearGradientPlaceholder';
import { PhotoGallery, type PhotoSource } from '@/components/PhotoGallery';
import { BackButton } from '@/components/chrome';
import { Screen } from '@/components/Screen';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';
import { usePlace } from '@/hooks/usePlace';
import { usePhotos } from '@/hooks/usePhotos';
import { formatCoords, hasCoords } from '@/utils/coords';
import { openPlaceOnMap } from '@/utils/maps';
import { formatTripDates, tripStatusLabel } from '@/utils/tripLabels';

export default function PlaceCardScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idParam ? Number(idParam) : null;
  const { place, trips, loading, error, update, remove } = usePlace(id);
  const placePhotos = usePhotos({ placeId: id });
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cat = place ? PLACE_CATEGORIES[place.category] : null;
  const coordsReady = place ? hasCoords(place.latitude, place.longitude) : false;
  const coordsText = useMemo(() => {
    if (!place || !coordsReady) return '';
    return formatCoords(place.latitude!, place.longitude!);
  }, [place, coordsReady]);

  const onCopy = async () => {
    if (!place || !coordsReady) return;
    await Clipboard.setStringAsync(coordsText);
    setToast('Координаты скопированы');
  };

  const onOpenMap = async () => {
    if (!place) return;
    try {
      await openPlaceOnMap({
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Не удалось открыть карту');
    }
  };

  const addPlacePhoto = async (source: PhotoSource) => {
    if (id == null) return;
    setBusy(true);
    try {
      if (source === 'library') await placePhotos.addFromLibrary({ placeId: id });
      else await placePhotos.addFromCamera({ placeId: id });
    } catch (e) {
      console.error(e);
      Alert.alert('Фото', e instanceof Error ? e.message : 'Не удалось добавить фото');
    } finally {
      setBusy(false);
    }
  };

  const deletePlacePhoto = async (photoId: number) => {
    try {
      await placePhotos.remove(photoId);
    } catch (e) {
      console.error(e);
      Alert.alert('Фото', e instanceof Error ? e.message : 'Не удалось удалить фото');
    }
  };

  const onDelete = () => {
    if (!place) return;
    Alert.alert(
      'Удалить место?',
      `«${place.name}» будет удалено из базы и из маршрутов поездок/идей.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await remove();
                router.back();
              } catch (e) {
                console.error(e);
                Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось удалить');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!place || !cat) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.error}>{error ?? 'Место не найдено'}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.catBadgeText, { color: cat.fg }]}>{cat.label}</Text>
        </View>
      </View>

      <LinearGradientPlaceholder colors={cat.cover} style={styles.cover}>
        <View style={styles.coverInner}>
          <IconPath d={cat.path} size={46} color="rgba(255,255,255,0.85)" strokeWidth={1.4} />
        </View>
      </LinearGradientPlaceholder>

      <Text style={styles.name}>{place.name}</Text>
      {place.city ? <Text style={styles.city}>{place.city}</Text> : null}
      {place.description ? <Text style={styles.desc}>{place.description}</Text> : null}

      <View style={styles.photosBlock}>
        <Text style={styles.sectionTitle}>Фотографии</Text>
        <PhotoGallery
          photos={placePhotos.photos}
          onAdd={(source) => void addPlacePhoto(source)}
          onDelete={(photo) => void deletePlacePhoto(photo.id)}
          busy={busy}
        />
      </View>

      {coordsReady ? (
        <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>КООРДИНАТЫ</Text>
          <Text style={styles.coordsValue}>{coordsText}</Text>
          <View style={styles.row}>
            <Pressable style={styles.ghostBtn} onPress={() => void onOpenMap()}>
              <Text style={styles.ghostBtnText}>Открыть карту</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => void onCopy()}>
              <Text style={styles.ghostBtnText}>Скопировать</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.ghostBtn, { marginTop: 9, flex: 0 }]}
            onPress={() => void onOpenMap()}
          >
            <Text style={styles.ghostBtnText}>Навигатор</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.noCoords}>
          <Text style={styles.noCoordsTitle}>Координаты не указаны</Text>
          <Text style={styles.noCoordsSub}>
            Карта откроется поиском по названию. Координаты можно добавить в любой момент.
          </Text>
          <Pressable style={styles.ghostBtn} onPress={() => void onOpenMap()}>
            <Text style={styles.ghostBtnText}>Открыть карту</Text>
          </Pressable>
          <Pressable
            style={[styles.ghostBtn, { marginTop: 9 }]}
            onPress={() =>
              router.push({ pathname: '/form/place', params: { id: String(place.id) } })
            }
          >
            <Text style={styles.ghostBtnText}>Добавить координаты</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <Pressable
          style={[styles.toggle, place.visitLater && styles.toggleActive]}
          disabled={busy}
          onPress={() => {
            void update({ visitLater: !place.visitLater });
          }}
        >
          <Text style={[styles.toggleText, place.visitLater && styles.toggleTextActive]}>
            Хочу посетить
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, place.liked && styles.toggleActive]}
          disabled={busy}
          onPress={() => {
            void update({ liked: !place.liked });
          }}
        >
          <Text style={[styles.toggleText, place.liked && styles.toggleTextActive]}>
            Понравилось
          </Text>
        </Pressable>
      </View>

      {trips.length > 0 ? (
        <View style={styles.tripsBlock}>
          <Text style={styles.sectionTitle}>В каких поездках</Text>
          <View style={styles.tripsCard}>
            {trips.map((trip, index) => (
              <Pressable
                key={trip.id}
                style={[styles.tripRow, index > 0 && styles.tripRowSep]}
                onPress={() =>
                  router.push({ pathname: '/trip/[id]', params: { id: String(trip.id) } })
                }
              >
                <View style={styles.tripText}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>
                  <Text style={styles.tripSub}>
                    {formatTripDates(trip.startDate, trip.endDate)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.tripBadge,
                    trip.status === 'active' && styles.tripBadgeActive,
                    trip.status === 'completed' && styles.tripBadgeDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.tripBadgeText,
                      trip.status === 'active' && styles.tripBadgeTextActive,
                      trip.status === 'completed' && styles.tripBadgeTextDone,
                    ]}
                  >
                    {tripStatusLabel(trip.status)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={styles.editBtn}
          onPress={() =>
            router.push({ pathname: '/form/place', params: { id: String(place.id) } })
          }
        >
          <Text style={styles.editBtnText}>Изменить</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={onDelete} disabled={busy}>
          <Text style={styles.deleteBtnText}>Удалить</Text>
        </Pressable>
      </View>

      <Snackbar
        visible={toast != null}
        onDismiss={() => setToast(null)}
        duration={2200}
        style={styles.snack}
      >
        {toast}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cover: {
    height: 140,
    borderRadius: 26,
  },
  coverInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.text,
  },
  city: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textStrong,
  },
  photosBlock: {
    marginTop: 20,
    marginBottom: 4,
  },
  coordsCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 16,
  },
  coordsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  coordsValue: {
    marginTop: 9,
    marginBottom: 14,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: colors.text,
  },
  noCoords: {
    marginTop: 16,
    backgroundColor: '#f4f5f1',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    borderRadius: 22,
    padding: 16,
  },
  noCoordsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  noCoordsSub: {
    marginTop: 6,
    marginBottom: 13,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  ghostBtnText: {
    fontWeight: '800',
    fontSize: 12.5,
    color: colors.text,
  },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentMuted,
  },
  toggleText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  toggleTextActive: {
    color: colors.accent,
  },
  tripsBlock: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
    marginBottom: 12,
    marginHorizontal: 2,
  },
  tripsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  tripRowSep: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tripText: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tripSub: {
    marginTop: 4,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  tripBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  tripBadgeActive: {
    backgroundColor: colors.accentMuted,
  },
  tripBadgeDone: {
    backgroundColor: '#eef0ec',
  },
  tripBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  tripBadgeTextActive: {
    color: colors.accent,
  },
  tripBadgeTextDone: {
    color: colors.textMuted,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  editBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  editBtnText: {
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#f0d4d0',
    backgroundColor: '#fdf6f5',
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontWeight: '800',
    color: '#b42318',
  },
  error: {
    color: '#b42318',
    fontWeight: '600',
  },
  snack: {
    backgroundColor: colors.accentDark,
  },
});
