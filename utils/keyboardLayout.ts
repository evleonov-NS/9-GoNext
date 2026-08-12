/**
 * Двунаправленный маппинг ошибочной раскладки ЙЦУКЕН ↔ QWERTY.
 * Пример: `,jkb` → «боли», `ghjn` → «прот».
 */

const EN =
  "`qwertyuiop[]asdfghjkl;'zxcvbnm,./" +
  '~QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?';
const RU =
  'ёйцукенгшщзхъфывапролджэячсмитьбю.' +
  'ЁЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,';

if (EN.length !== RU.length) {
  throw new Error('keyboardLayout: длины раскладок не совпадают');
}

const EN_TO_RU = new Map<string, string>();
const RU_TO_EN = new Map<string, string>();

for (let i = 0; i < EN.length; i += 1) {
  EN_TO_RU.set(EN[i], RU[i]);
  RU_TO_EN.set(RU[i], EN[i]);
}

/** Меняет раскладку каждого символа (EN↔RU), прочие символы оставляет. */
export function swapKeyboardLayout(text: string): string {
  let out = '';
  for (const ch of text) {
    out += EN_TO_RU.get(ch) ?? RU_TO_EN.get(ch) ?? ch;
  }
  return out;
}

/** Исходный запрос и вариант с переключённой раскладкой (без дублей). */
export function layoutVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const swapped = swapKeyboardLayout(trimmed);
  return swapped === trimmed ? [trimmed] : [trimmed, swapped];
}

/** true, если haystack содержит query или его вариант в другой раскладке. */
export function textMatchesQuery(haystack: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const hay = haystack.toLowerCase();
  return layoutVariants(q).some((variant) => hay.includes(variant.toLowerCase()));
}
