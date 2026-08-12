'use strict';

/**
 * Единственный источник версии приложения.
 * Не хардкодить номер версии в UI, логах, app.config, имени установщика —
 * импортировать отсюда `__version__` / helpers.
 */
const __version__ = '0.5.0';

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Строка для интерфейса и логов: «0.1.0: 2026-08-12 21:58»
 * (версия: дата время).
 */
function formatAppVersion(date = new Date()) {
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const t = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${__version__}: ${d} ${t}`;
}

/** Базовое имя установщика / артефакта сборки (без расширения). */
function getInstallerBaseName() {
  return `GoNext-${__version__}`;
}

module.exports = {
  __version__,
  formatAppVersion,
  getInstallerBaseName,
};
