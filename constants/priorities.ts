import i18n from '@/i18n';
import type { PlacePriority, TripIdeaStatus } from '@/types';

export const PLACE_PRIORITY_LIST: {
  id: PlacePriority;
  label: string;
  bg: string;
  fg: string;
}[] = [
  { id: 'must', label: 'Обязательно', bg: '#e5f0ea', fg: '#2f6d58' },
  { id: 'optional', label: 'Если успею', bg: '#eef1f7', fg: '#41567f' },
  { id: 'interesting', label: 'Просто интересно', bg: '#f0f0ec', fg: '#5f625a' },
];

export const PLACE_PRIORITIES = Object.fromEntries(
  PLACE_PRIORITY_LIST.map((p) => [p.id, p])
) as Record<PlacePriority, (typeof PLACE_PRIORITY_LIST)[number]>;

export function priorityLabel(priority: PlacePriority): string {
  return i18n.t(`priority.${priority}`);
}

export const IDEA_STATUS_LIST: {
  id: TripIdeaStatus;
  label: string;
}[] = [
  { id: 'active', label: 'Активная' },
  { id: 'converted', label: 'Поездка создана' },
  { id: 'archived', label: 'Архив' },
];

export function ideaStatusLabel(status: TripIdeaStatus): string {
  return i18n.t(`ideaStatus.${status}`);
}

/** Детерминированный градиент обложки идеи по id (пока нет coverPhoto). */
export const IDEA_COVER_PALETTE: [string, string][] = [
  ['#3a6b4d', '#9dc3aa'],
  ['#8b5a2b', '#d9ab7c'],
  ['#41567f', '#9fb2cf'],
  ['#5d4a80', '#b3a4cf'],
  ['#3f6157', '#a3bdb4'],
  ['#8d3f57', '#d69cad'],
];

export function ideaCoverForId(id: number): [string, string] {
  return IDEA_COVER_PALETTE[Math.abs(id) % IDEA_COVER_PALETTE.length];
}
