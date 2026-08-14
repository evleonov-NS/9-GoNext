import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SCREEN_PAD_TOP = 26;
export const TAB_BAR_RESERVE = 110;
export const ACTIVE_CARD_ESTIMATE = 280;
export const HERO_MAX = 420;
export const HERO_MIN = 260;
/** Доля высоты hero, на которой картинка растворяется в фон. */
export const HERO_FADE_RATIO = 0.45;

/** Высота hero: 420dp, на коротком экране меньше, чтобы карточка поездки была видна ≥60%. */
export function useHeroHeight(): number {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const visible = height - (TAB_BAR_RESERVE + insets.bottom);
  const minCardVisible = Math.round(ACTIVE_CARD_ESTIMATE * 0.6);
  return Math.min(HERO_MAX, Math.max(HERO_MIN, visible - minCardVisible));
}

export function heroFadeHeight(heroHeight: number): number {
  return Math.round(heroHeight * HERO_FADE_RATIO);
}

/** Насколько контент заходит в зону растворения — карточка начинается на его границе. */
export function heroContentOverlap(heroHeight: number): number {
  return Math.round(heroFadeHeight(heroHeight) * 0.42);
}
