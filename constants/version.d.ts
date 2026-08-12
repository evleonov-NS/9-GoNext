/** Единственный источник версии — см. ./version.js */

export const __version__: string;

/** «0.1.0: ГГГГ-ММ-ДД ЧЧ:ММ» для UI и логов */
export function formatAppVersion(date?: Date): string;

/** Имя артефакта установщика без расширения */
export function getInstallerBaseName(): string;
