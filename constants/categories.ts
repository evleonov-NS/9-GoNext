import i18n from '@/i18n';

export type PlaceCategoryId =
  | 'sight'
  | 'nature'
  | 'museum'
  | 'food'
  | 'walk'
  | 'hotel'
  | 'shopping'
  | 'other';

export type PlaceCategory = {
  id: PlaceCategoryId;
  label: string;
  shortLabel: string;
  /** SVG path d (viewBox 0 0 24 24), как в прототипе */
  path: string;
  bg: string;
  fg: string;
  cover: [string, string];
};

/** 8 категорий мест — цвета и иконки из gonext_prototype.html */
export const PLACE_CATEGORIES: Record<PlaceCategoryId, PlaceCategory> = {
  sight: {
    id: 'sight',
    label: 'Достопримечательность',
    shortLabel: 'Достопр.',
    path: 'M4 20h16M6 20V10l6-5 6 5v10M10 20v-6h4v6',
    bg: '#eef1f7',
    fg: '#41567f',
    cover: ['#41567f', '#9fb2cf'],
  },
  nature: {
    id: 'nature',
    label: 'Природа',
    shortLabel: 'Природа',
    path: 'M3 19h18M5 19l5.5-8L14 16l2-2.5L21 19',
    bg: '#e8f1ea',
    fg: '#3a6b4d',
    cover: ['#3a6b4d', '#9dc3aa'],
  },
  museum: {
    id: 'museum',
    label: 'Музей',
    shortLabel: 'Музей',
    path: 'M3 9l9-5 9 5M4 9h16M6 9v8M10 9v8M14 9v8M18 9v8M3 20h18',
    bg: '#f2eef7',
    fg: '#5d4a80',
    cover: ['#5d4a80', '#b3a4cf'],
  },
  food: {
    id: 'food',
    label: 'Еда',
    shortLabel: 'Еда',
    path: 'M7 3v8a2 2 0 0 0 4 0V3M9 11v10M15 21V3c2 1 3 3 3 6s-1 4-3 4',
    bg: '#fbeee6',
    fg: '#8b5a2b',
    cover: ['#8b5a2b', '#d9ab7c'],
  },
  walk: {
    id: 'walk',
    label: 'Прогулка',
    shortLabel: 'Прогулка',
    path: 'M8 4c1.6 0 2.4 1.6 2 4-.4 2-1 3-2.5 3S5 9.6 5.5 7 6.4 4 8 4M8 14c1 0 1.6.8 1.6 2s-.6 2-1.6 2-1.6-.8-1.6-2 .6-2 1.6-2M16 7c1.6 0 2.4 1.6 2 4-.4 2-1 3-2.5 3s-2.4-1.6-2-4 .9-3 2.5-3M16 17c1 0 1.6.8 1.6 2s-.6 2-1.6 2-1.6-.8-1.6-2 .6-2 1.6-2',
    bg: '#eaf0ee',
    fg: '#3f6157',
    cover: ['#3f6157', '#a3bdb4'],
  },
  hotel: {
    id: 'hotel',
    label: 'Отель',
    shortLabel: 'Отель',
    path: 'M3 18v-6h13a4 4 0 0 1 4 4v2M3 12V7M3 18h18M7 12V9.5h4V12',
    bg: '#eef0f3',
    fg: '#4b5563',
    cover: ['#4b5563', '#aab3bd'],
  },
  shopping: {
    id: 'shopping',
    label: 'Покупки',
    shortLabel: 'Покупки',
    path: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
    bg: '#fdeef2',
    fg: '#8d3f57',
    cover: ['#8d3f57', '#d69cad'],
  },
  other: {
    id: 'other',
    label: 'Другое',
    shortLabel: 'Другое',
    path: 'M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 .01 0',
    bg: '#f0f0ec',
    fg: '#5f625a',
    cover: ['#5f625a', '#b4b6ae'],
  },
};

export const PLACE_CATEGORY_LIST = Object.values(PLACE_CATEGORIES);

export function categoryLabel(id: PlaceCategoryId): string {
  return i18n.t(`category.${id}`);
}

export function categoryShortLabel(id: PlaceCategoryId): string {
  return i18n.t(`categoryShort.${id}`);
}

export const NAV_ICONS = {
  home: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  want: 'M12 20s-7-4.6-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.4 12 20 12 20z',
  trips: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  places: 'M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 .01 0',
} as const;
