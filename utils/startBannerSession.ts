/**
 * Баннер «Сегодня начинается…»: «Позже» скрывает до следующего запуска приложения.
 * Хранение в памяти процесса — без AsyncStorage.
 */
let dismissedTripId: number | null = null;

export function dismissStartBanner(tripId: number): void {
  dismissedTripId = tripId;
}

export function isStartBannerDismissed(tripId: number): boolean {
  return dismissedTripId === tripId;
}

export function clearStartBannerDismiss(): void {
  dismissedTripId = null;
}
