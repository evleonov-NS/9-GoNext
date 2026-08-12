import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradientPlaceholder } from '@/components/LinearGradientPlaceholder';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { PlaceCategoryId } from '@/constants/categories';
import { PLACE_CATEGORIES } from '@/constants/categories';
import { colors, radii } from '@/constants/theme';

type ActiveTripCardProps = {
  dayLabel: string;
  title: string;
  nextName: string;
  leftAfter: number;
  visited: number;
  left: number;
  dates: string;
  onNext?: () => void;
  onNavigator?: () => void;
  onOpenTrip?: () => void;
};

export function ActiveTripCard({
  dayLabel,
  title,
  nextName,
  leftAfter,
  visited,
  left,
  dates,
  onNext,
  onNavigator,
  onOpenTrip,
}: ActiveTripCardProps) {
  return (
    <View style={styles.active}>
      <View style={styles.activeGlow} />
      <View style={styles.activeInner}>
        <Text style={styles.activeEyebrow}>ТЕКУЩАЯ ПОЕЗДКА · {dayLabel}</Text>
        <Text style={styles.activeTitle}>{title}</Text>
        <Text style={styles.activeSub}>
          Следующее место — {nextName}. После него в маршруте ещё {leftAfter}.
        </Text>
        <View style={styles.stats}>
          <View>
            <Text style={styles.statValue}>{visited}</Text>
            <Text style={styles.statLabel}>посещено</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{left}</Text>
            <Text style={styles.statLabel}>осталось</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{dates}</Text>
            <Text style={styles.statLabel}>даты</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Pressable style={styles.primaryBtn} onPress={onNext}>
            <Text style={styles.primaryBtnText}>Следующее место</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={onNavigator}>
            <Text style={styles.ghostBtnText}>Навигатор</Text>
          </Pressable>
        </View>
        <Pressable style={styles.linkBtn} onPress={onOpenTrip}>
          <Text style={styles.linkBtnText}>Открыть маршрут поездки</Text>
        </Pressable>
      </View>
    </View>
  );
}

type IdeaCardProps = {
  title: string;
  sub: string;
  countLabel: string;
  cover: [string, string];
  onPress?: () => void;
};

export function IdeaCard({
  title,
  sub,
  countLabel,
  cover,
  onPress,
}: IdeaCardProps) {
  return (
    <Pressable style={styles.ideaCard} onPress={onPress}>
      <LinearGradientPlaceholder colors={cover} style={styles.ideaCover}>
        <View style={styles.ideaBadge}>
          <Text style={styles.ideaBadgeText}>{countLabel}</Text>
        </View>
      </LinearGradientPlaceholder>
      <View style={styles.ideaBody}>
        <Text style={styles.ideaTitle}>{title}</Text>
        <Text style={styles.ideaSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

type PlaceRowProps = {
  name: string;
  city: string;
  category: PlaceCategoryId;
  onPress?: () => void;
};

export function PlaceRow({ name, city, category, onPress }: PlaceRowProps) {
  const cat = PLACE_CATEGORIES[category];
  return (
    <Pressable style={styles.placeRow} onPress={onPress}>
      <CategoryIcon category={category} size={44} />
      <View style={styles.placeText}>
        <Text style={styles.placeName}>{name}</Text>
        <Text style={styles.placeMeta}>
          {city} · {cat.shortLabel}
        </Text>
      </View>
    </Pressable>
  );
}

type TripRowProps = {
  title: string;
  dates: string;
  statusLabel: string;
  countLabel: string;
  onPress?: () => void;
};

export function TripRow({
  title,
  dates,
  statusLabel,
  countLabel,
  onPress,
}: TripRowProps) {
  return (
    <Pressable style={styles.tripRow} onPress={onPress}>
      <View style={styles.tripTop}>
        <Text style={styles.tripStatus}>{statusLabel}</Text>
        <Text style={styles.tripCount}>{countLabel}</Text>
      </View>
      <Text style={styles.tripTitle}>{title}</Text>
      <Text style={styles.tripDates}>{dates}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.accent,
    borderRadius: radii.sheet,
    padding: 20,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  activeGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.07)',
    right: -84,
    top: -98,
  },
  activeInner: {
    position: 'relative',
  },
  activeEyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: 'rgba(255,255,255,0.8)',
  },
  activeTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.textOnAccent,
  },
  activeSub: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: 300,
  },
  stats: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  row: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.accentDark,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  linkBtn: {
    marginTop: 10,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  linkBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  ideaCard: {
    width: 212,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  ideaCover: {
    height: 86,
    justifyContent: 'flex-end',
  },
  ideaBadge: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  ideaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnAccent,
  },
  ideaBody: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 16,
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  ideaSub: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 12,
  },
  placeText: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  placeMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tripRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 16,
  },
  tripTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripStatus: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.accent,
  },
  tripCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text,
  },
  tripDates: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
