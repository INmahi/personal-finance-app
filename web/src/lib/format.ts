const numberFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an amount as Bangladeshi Taka, e.g. ৳1,234.50 */
export function formatBDT(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}৳${numberFmt.format(Math.abs(amount))}`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** Format a YYYY-MM-DD date string as e.g. 01 Jul 2026 */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return dateFmt.format(new Date(y, m - 1, d));
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** First day of the current month as YYYY-MM-DD (local). */
export function monthStartISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}
