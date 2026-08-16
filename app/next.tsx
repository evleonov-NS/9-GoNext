import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Snackbar, Text } from 'react-native-paper';
import { BackButton, EmptyState } from '@/components/chrome';
import { IconPath } from '@/components/IconPath';
import { LinearGradientPlaceholder } from '@/components/LinearGradientPlaceholder';
import { PhotoGallery, promptPhotoSource, type PhotoSource } from '@/components/PhotoGallery';
import { Screen } from '@/components/Screen';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';
import { useNextPlace } from '@/hooks/useNextPlace';
import { usePhotos } from '@/hooks/usePhotos';
import type { TripPlaceRow } from '@/hooks/useTrip';
import { formatCoords, hasCoords } from '@/utils/coords';
import { openPlaceOnMap } from '@/utils/maps';
import { dateForTripDay, formatSingleDate } from '@/utils/tripDates';

type Mode = 'card' | 'visit' | 'done';

function visitDateLabel(iso: string | null): string {
  if (!iso) {
    return new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  }
  const formatted = formatSingleDate(iso);
  if (formatted) return formatted;
  return iso;
}

export default function NextScreen() {
  const router = useRouter();
  const {
    trip,
    next,
    pendingCount,
    visitedCount,
    totalCount,
    loading,
    error,
    markVisited,
    skip,
    saveVisit,
    complete,
  } = useNextPlace();

  const [mode, setMode] = useState<Mode>('card');
  const [visited, setVisited] = useState<TripPlaceRow | null>(null);
  const [notes, setNotes] = useState('');
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneTripId, setDoneTripId] = useState<number | null>(null);
  const [doneTitle, setDoneTitle] = useState<string | null>(null);

  const visitPhotos = usePhotos({ tripPlaceId: visited?.id ?? null });

  const showingVisit = mode === 'visit' && visited != null;
  const showingDone =
    mode === 'done' || (!loading && trip != null && next == null && !showingVisit);
  const noActive = !loading && trip == null && !showingVisit && !showingDone;

  const place = showingVisit ? visited.place : next?.place ?? null;
  const cat = place ? PLACE_CATEGORIES[place.category] : null;
  const coordsReady = place ? hasCoords(place.latitude, place.longitude) : false;
  const coordsText = useMemo(() => {
    if (!place || !coordsReady) return '';
    return formatCoords(place.latitude!, place.longitude!);
  }, [place, coordsReady]);

  const dayLabel = useMemo(() => {
    if (!trip || !next?.dayNumber) return null;
    const dateLabel = formatSingleDate(dateForTripDay(trip.startDate, next.dayNumber));
    return dateLabel ? `День ${next.dayNumber} · ${dateLabel}` : `День ${next.dayNumber}`;
  }, [trip, next]);

  const pendingAfterVisit = Math.max(0, pendingCount);

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

  const persistVisitExtras = async (row: TripPlaceRow) => {
    await saveVisit(row.id, { notes, liked });
  };

  const addVisitPhoto = async (source: PhotoSource) => {
    if (!visited) return;
    const link = { tripPlaceId: visited.id, placeId: visited.placeId };
    setBusy(true);
    try {
      if (source === 'library') await visitPhotos.addFromLibrary(link);
      else await visitPhotos.addFromCamera(link);
    } catch (e) {
      console.error(e);
      Alert.alert('Фото', e instanceof Error ? e.message : 'Не удалось добавить фото');
    } finally {
      setBusy(false);
    }
  };

  const deleteVisitPhoto = async (id: number) => {
    try {
      await visitPhotos.remove(id);
    } catch (e) {
      console.error(e);
      Alert.alert('Фото', e instanceof Error ? e.message : 'Не удалось удалить фото');
    }
  };

  const goAfterVisit = async (row: TripPlaceRow) => {
    await persistVisitExtras(row);
    setVisited(null);
    setNotes('');
    setLiked(false);
    if (pendingAfterVisit === 0) {
      setDoneTripId(trip?.id ?? row.tripId);
      setDoneTitle(trip?.title ?? null);
      setMode('done');
    } else {
      setMode('card');
    }
  };

  const onMarkVisited = async () => {
    if (!next || busy) return;
    setBusy(true);
    try {
      const row = await markVisited(next.id);
      const snapshot: TripPlaceRow = row ?? {
        ...next,
        status: 'visited',
      };
      setVisited(snapshot);
      setNotes(snapshot.notes ?? '');
      setLiked(snapshot.liked);
      setMode('visit');
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отметить посещение');
    } finally {
      setBusy(false);
    }
  };

  const onSkip = async () => {
    if (!next || busy) return;
    const leftAfter = pendingCount - 1;
    setBusy(true);
    try {
      await skip(next.id);
      if (leftAfter <= 0) {
        setDoneTripId(trip?.id ?? next.tripId);
        setDoneTitle(trip?.title ?? null);
        setMode('done');
      } else {
        setMode('card');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось пропустить место');
    } finally {
      setBusy(false);
    }
  };

  const onContinue = async () => {
    if (!visited || busy) return;
    setBusy(true);
    try {
      await goAfterVisit(visited);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  const onBackFromVisit = async () => {
    if (!visited) {
      router.back();
      return;
    }
    setBusy(true);
    try {
      await persistVisitExtras(visited);
    } catch (e) {
      console.error(e);
    } finally {
      setVisited(null);
      setNotes('');
      setLiked(false);
      setMode('card');
      setBusy(false);
      router.back();
    }
  };

  const onComplete = () => {
    const title = doneTitle ?? trip?.title ?? 'поездку';
    const tripId = doneTripId ?? trip?.id;
    Alert.alert(
      'Завершить поездку?',
      `«${title}» станет дневником. Продолжить?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await complete();
                if (tripId != null) {
                  router.replace({
                    pathname: '/trip/[id]',
                    params: { id: String(tripId) },
                  });
                } else {
                  router.back();
                }
              } catch (e) {
                console.error(e);
                Alert.alert(
                  'Ошибка',
                  e instanceof Error ? e.message : 'Не удалось завершить поездку'
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  };

  const openTrip = () => {
    const tripId = doneTripId ?? trip?.id;
    if (tripId == null) {
      router.push('/trips');
      return;
    }
    router.push({ pathname: '/trip/[id]', params: { id: String(tripId) } });
  };

  if (loading && !showingVisit) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (error && !trip && !showingVisit) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.error}>{error}</Text>
        </View>
      </Screen>
    );
  }

  if (noActive) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
        </View>
        <EmptyState
          title="Нет активной поездки"
          subtitle="Режим «Следующее место» работает, пока поездка в статусе «текущая»."
          actionLabel="К поездкам"
          onAction={() => router.push('/trips')}
        />
      </Screen>
    );
  }

  if (showingVisit && visited && cat) {
    const lastPending = pendingAfterVisit === 0;
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => void onBackFromVisit()} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{trip?.title ?? 'Поездка'}</Text>
            <Text style={styles.title}>Посещено</Text>
          </View>
        </View>

        <View style={styles.checkWrap}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.visitName}>{visited.place.name}</Text>
        <Text style={styles.visitDate}>{visitDateLabel(visited.visitDate)}</Text>

        <Text style={styles.label}>Как впечатления?</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Необязательно"
          placeholderTextColor={colors.textMuted}
          style={styles.notes}
          multiline
        />

        <View style={styles.photos}>
          <PhotoGallery
            photos={visitPhotos.photos}
            onAdd={(source) => void addVisitPhoto(source)}
            onDelete={(photo) => void deleteVisitPhoto(photo.id)}
            busy={busy}
            showAddTile={false}
          />
        </View>

        <Pressable
          style={[styles.secondary, busy && styles.disabled]}
          disabled={busy}
          onPress={() => promptPhotoSource((source) => void addVisitPhoto(source))}
        >
          <Text style={styles.secondaryText}>+ Добавить фото</Text>
        </Pressable>

        <Pressable
          style={[styles.likeBtn, liked && styles.likeBtnActive]}
          onPress={() => setLiked((v) => !v)}
        >
          <Text style={[styles.likeText, liked && styles.likeTextActive]}>
            {liked ? '♥ Понравилось' : '♡ Отметить «понравилось»'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void onContinue()}
        >
          <Text style={styles.primaryText}>
            {lastPending ? 'Все места пройдены' : 'К следующему месту'}
          </Text>
        </Pressable>

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

  if (showingDone) {
    const title = doneTitle ?? trip?.title ?? 'Поездка';
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{title}</Text>
            <Text style={styles.title}>Все места пройдены</Text>
          </View>
        </View>
        <EmptyState
          title="Маршрут пройден"
          subtitle={`Посещено ${visitedCount} из ${totalCount || visitedCount}. Можно завершить поездку — она станет дневником.`}
          actionLabel="Завершить поездку"
          onAction={onComplete}
        />
        <Pressable style={styles.linkBtn} onPress={openTrip}>
          <Text style={styles.linkBtnText}>Открыть маршрут</Text>
        </Pressable>
      </Screen>
    );
  }

  if (!next || !place || !cat) {
    return (
      <Screen>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.error}>Место не найдено</Text>
        </View>
      </Screen>
    );
  }

  const meta = [place.city, cat.label].filter(Boolean).join(' · ');

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{trip?.title ?? 'Поездка'}</Text>
          <Text style={styles.title}>Следующее место</Text>
        </View>
      </View>

      <View style={styles.card}>
        <LinearGradientPlaceholder colors={cat.cover} style={styles.cover}>
          <View style={styles.coverInner}>
            <IconPath d={cat.path} size={46} color="rgba(255,255,255,0.85)" strokeWidth={1.4} />
          </View>
        </LinearGradientPlaceholder>
        <View style={styles.body}>
          {dayLabel ? <Text style={styles.day}>{dayLabel}</Text> : null}
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.meta}>{meta}</Text>
          {next.notes ? <Text style={styles.note}>{next.notes}</Text> : null}
        </View>
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
            Карта откроется поиском по названию. Координаты можно добавить в карточке места.
          </Text>
          <Pressable style={styles.ghostBtn} onPress={() => void onOpenMap()}>
            <Text style={styles.ghostBtnText}>Открыть карту</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void onMarkVisited()}
        >
          <Text style={styles.primaryText}>Посещено</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void onSkip()}
        >
          <Text style={styles.secondaryText}>Пропустить</Text>
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
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    overflow: 'hidden',
  },
  cover: {
    height: 160,
  },
  coverInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
  },
  day: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.accent,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 12,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textStrong,
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
  actions: {
    marginTop: 18,
    gap: 9,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginTop: 9,
  },
  secondaryText: {
    fontWeight: '800',
    color: colors.text,
  },
  disabled: {
    opacity: 0.5,
  },
  checkWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  checkMark: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
  },
  visitName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  visitDate: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  notes: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  photos: {
    marginTop: 12,
  },
  likeBtn: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  likeBtnActive: {
    backgroundColor: '#fdeef2',
    borderColor: '#f0d4dc',
  },
  likeText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  likeTextActive: {
    color: '#8d3f57',
  },
  linkBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  error: {
    color: '#b42318',
    fontWeight: '600',
    flex: 1,
  },
  snack: {
    backgroundColor: colors.accentDark,
  },
});
