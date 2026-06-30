import type { Category, CategoryKind, Transaction } from '../types/db';
import { categoryColor, colorFor } from './colors';

/** Display name for a transaction's category: saved category, else custom label, else Uncategorized. */
export function txCategoryName(t: Transaction, byId: Record<string, Category>): string {
  if (t.category_id && byId[t.category_id]) return byId[t.category_id].name;
  if (t.category_label) return t.category_label;
  return 'Uncategorized';
}

/** Display color for a transaction's category. */
export function txCategoryColor(t: Transaction, byId: Record<string, Category>): string {
  if (t.category_id && byId[t.category_id]) return categoryColor(byId[t.category_id]);
  if (t.category_label) return colorFor(t.category_label);
  return 'var(--border)';
}

/**
 * Resolve a typed "Spent on" value WITHOUT creating anything: if it matches an
 * existing category (case-insensitive) use that id; otherwise keep it as a
 * free-text label on the transaction only.
 */
export function resolveCategoryInput(
  name: string,
  kind: CategoryKind,
  categories: Category[],
): { category_id: string | null; category_label: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { category_id: null, category_label: null };
  const match = categories.find(
    (c) => c.kind === kind && c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (match) return { category_id: match.id, category_label: null };
  return { category_id: null, category_label: trimmed };
}
