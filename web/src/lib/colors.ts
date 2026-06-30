// A distinct, warm-leaning palette so categories read as different colors.
const PALETTE = [
  '#c96442', // coral (primary)
  '#2f7d57', // green
  '#3b82a0', // teal-blue
  '#8b5cf6', // violet
  '#d98a26', // amber
  '#c2426b', // raspberry
  '#5b8c2a', // olive
  '#0e7c86', // deep teal
  '#6b5bd2', // indigo
  '#a8741a', // ochre
  '#3a7d44', // forest
  '#b3402c', // brick
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic palette color for a seed string. */
export function colorFor(seed: string): string {
  return PALETTE[hash(seed) % PALETTE.length];
}

/** A category's explicit color, or a stable derived one if none set. */
export function categoryColor(c: { color: string | null; id: string; name: string }): string {
  return c.color ?? colorFor(c.id || c.name);
}

/** Suggest a fresh palette color for the Nth new category. */
export function suggestColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
