import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Category, NewTransaction, Transaction } from '../types/db';
import {
  createTransaction,
  listCategories,
  listTransactions,
  softDeleteTransaction,
} from '../lib/api';
import { monthStartISO } from '../lib/format';

interface FinanceState {
  loading: boolean;
  error: string | null;
  categories: Category[];
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
  balance: number;
  spentThisMonth: number;
  incomeThisMonth: number;
  refresh: () => Promise<void>;
  addTransaction: (input: NewTransaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceState | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [cats, txs] = await Promise.all([listCategories(), listTransactions()]);
      setCategories(cats);
      setTransactions(txs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTransaction = useCallback(async (input: NewTransaction) => {
    const created = await createTransaction(input);
    setTransactions((prev) => sortTx([created, ...prev]));
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    await softDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const derived = useMemo(() => {
    const categoriesById: Record<string, Category> = {};
    for (const c of categories) categoriesById[c.id] = c;

    const monthStart = monthStartISO();
    let balance = 0;
    let spentThisMonth = 0;
    let incomeThisMonth = 0;
    for (const t of transactions) {
      if (t.direction === 'in') balance += t.amount;
      else balance -= t.amount;
      if (t.occurred_on >= monthStart) {
        if (t.direction === 'out') spentThisMonth += t.amount;
        else incomeThisMonth += t.amount;
      }
    }
    return { categoriesById, balance, spentThisMonth, incomeThisMonth };
  }, [categories, transactions]);

  const value: FinanceState = {
    loading,
    error,
    categories,
    transactions,
    refresh,
    addTransaction,
    removeTransaction,
    ...derived,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

function sortTx(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) =>
    a.occurred_on === b.occurred_on
      ? b.created_at.localeCompare(a.created_at)
      : b.occurred_on.localeCompare(a.occurred_on),
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance(): FinanceState {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
