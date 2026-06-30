import { supabase } from './supabase';
import type {
  Category,
  FixedExpense,
  NewCategory,
  NewFixedExpense,
  NewTransaction,
  Transaction,
} from '../types/db';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

/* ---------- categories ---------- */

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('deleted', false)
    .order('kind', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(input: NewCategory): Promise<Category> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'color'>>,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function softDeleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').update({ deleted: true }).eq('id', id);
  if (error) throw error;
}

/* ---------- transactions ---------- */

export async function listTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('deleted', false)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
}

export async function createTransaction(input: NewTransaction): Promise<Transaction> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  const row = data as Transaction;
  return { ...row, amount: Number(row.amount) };
}

export async function softDeleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').update({ deleted: true }).eq('id', id);
  if (error) throw error;
}

/* ---------- fixed expenses ---------- */

export async function listFixedExpenses(): Promise<FixedExpense[]> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('deleted', false)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as FixedExpense[]).map((f) => ({ ...f, amount: Number(f.amount) }));
}

export async function createFixedExpense(input: NewFixedExpense): Promise<FixedExpense> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({ ...input, user_id })
    .select()
    .single();
  if (error) throw error;
  const row = data as FixedExpense;
  return { ...row, amount: Number(row.amount) };
}

export async function updateFixedExpense(
  id: string,
  patch: Partial<Pick<FixedExpense, 'name' | 'amount' | 'category_id' | 'note' | 'active'>>,
): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  const row = data as FixedExpense;
  return { ...row, amount: Number(row.amount) };
}

export async function softDeleteFixedExpense(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_expenses').update({ deleted: true }).eq('id', id);
  if (error) throw error;
}
