import i18n from '@/i18n';

export function errorMessage(e: unknown, fallbackKey = 'alerts.loadFailed'): string {
  return e instanceof Error ? e.message : i18n.t(fallbackKey);
}
