export type Direction = 'in' | 'out';
export type PaymentMethod = 'cash' | 'bkash' | 'bank';
export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  color: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  direction: Direction;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  category_id: string | null;
  payment_method: PaymentMethod;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface NewTransaction {
  direction: Direction;
  amount: number;
  occurred_on: string;
  category_id: string | null;
  payment_method: PaymentMethod;
  note: string | null;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bkash', label: 'bKash' },
  { value: 'bank', label: 'Bank' },
];
