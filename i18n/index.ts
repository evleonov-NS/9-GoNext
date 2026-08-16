import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'ru';
export const LANGUAGE_STORAGE_KEY = 'gonext.language';

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'ru' || value === 'en';
}

export function dateLocaleTag(language: string = i18n.language): string {
  return language === 'en' ? 'en-US' : 'ru-RU';
}

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
