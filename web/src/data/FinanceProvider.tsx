import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Category,
  FixedExpense,
  NewCategory,
  NewFixedExpense,
  NewTransaction,
  Transaction,
} from '../types/db';
import * as api from '../lib/api';
import { monthStartISO } from '../lib/format';

interface FinanceState {
  loading: boolean;
  error: string | null;
  categories: Category[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  categoriesById: Record<string, Category>;
  balance: number;
  spentThisMonth: number;
  incomeThisMonth: number;
  fixedMonthlyTotal: number;
  refresh: () => Promise<void>;
  addTransaction: (input: NewTransaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addCategory: (input: NewCategory) => Promise<void>;
  renameCategory: (id: string, patch: { name?: string; color?: string | null }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addFixedExpense: (input: NewFixedExpense) => Promise<void>;
  editFixedExpense: (id: string, patch: Partial<NewFixedExpense>) => Promise<void>;
  removeFixedExpense: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceState | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [cats, txs, fx] = await Promise.all([
        api.listCategories(),
        api.listTransactions(),
        api.listFixedExpenses(),
      ]);
      setCategories(cats);
      setTransactions(txs);
      setFixedExpenses(fx);
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
    const created = await api.createTransaction(input);
    setTransactions((prev) => sortTx([created, ...prev]));
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    await api.softDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback(async (input: NewCategory) => {
    const created = await api.createCategory(input);
    setCategories((prev) => [...prev, created]);
  }, []);

  const renameCategory = useCallback(
    async (id: string, patch: { name?: string; color?: string | null }) => {
      const updated = await api.updateCategory(id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [],
  );

  const removeCategory = useCallback(async (id: string) => {
    await api.softDeleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addFixedExpense = useCallback(async (input: NewFixedExpense) => {
    const created = await api.createFixedExpense(input);
    setFixedExpenses((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const editFixedExpense = useCallback(async (id: string, patch: Partial<NewFixedExpense>) => {
    const updated = await api.updateFixedExpense(id, patch);
    setFixedExpenses((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  const removeFixedExpense = useCallback(async (id: string) => {
    await api.softDeleteFixedExpense(id);
    setFixedExpenses((prev) => prev.filter((f) => f.id !== id));
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
    const fixedMonthlyTotal = fixedExpenses
      .filter((f) => f.active)
      .reduce((s, f) => s + f.amount, 0);

    return { categoriesById, balance, spentThisMonth, incomeThisMonth, fixedMonthlyTotal };
  }, [categories, transactions, fixedExpenses]);

  const value: FinanceState = {
    loading,
    error,
    categories,
    transactions,
    fixedExpenses,
    refresh,
    addTransaction,
    removeTransaction,
    addCategory,
    renameCategory,
    removeCategory,
    addFixedExpense,
    editFixedExpense,
    removeFixedExpense,
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
