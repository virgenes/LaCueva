const FILLED = "█";
const EMPTY = "░";

/**
 * Generates an ASCII progress bar.
 * Example output: [████████████░░░░░░░░] 60%
 *
 * @param value  Current value (clamped to [0, max])
 * @param max    Maximum value
 * @param length Number of characters inside the brackets (default 20)
 */
export function progressBar(value: number, max: number, length = 20): string {
  const clamped = Math.max(0, Math.min(value, max));
  const ratio = max === 0 ? 0 : clamped / max;
  const filledCount = Math.round(ratio * length);
  const emptyCount = length - filledCount;

  const bar = FILLED.repeat(filledCount) + EMPTY.repeat(emptyCount);
  const percent = Math.round(ratio * 100);

  return `[${bar}] ${percent}%`;
}
