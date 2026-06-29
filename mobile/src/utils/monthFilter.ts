/** Recent months (current first). No "all" — exam prep is month-by-month. */
export function buildMonthFilterOptions(count = 6): { key: string; value: string }[] {
  const options: { key: string; value: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({ key: value, value });
  }

  return options;
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
