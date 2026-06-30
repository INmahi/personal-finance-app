import { supabase } from './supabase';
import type { Category, Transaction, NewTransaction } from '../types/db';

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
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: user.id })
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
