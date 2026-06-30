import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { Direction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';

export default function TransactionForm() {
  const { categories, addTransaction } = useFinance();
  const [direction, setDirection] = useState<Direction>('out');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = direction === 'out' ? 'expense' : 'income';
  const cats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);

  function switchDirection(d: Direction) {
    setDirection(d);
    setCategoryId('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    setBusy(true);
    try {
      await addTransaction({
        direction,
        amount: amt,
        occurred_on: date,
        category_id: categoryId || null,
        payment_method: payment,
        note: note.trim() || null,
      });
      setAmount('');
      setNote('');
      setCategoryId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div className="seg" role="group" aria-label="Type" style={{ alignSelf: 'flex-start' }}>
        <button type="button" className={direction === 'out' ? 'active' : ''} onClick={() => switchDirection('out')}>
          Expense
        </button>
        <button type="button" className={direction === 'in' ? 'active' : ''} onClick={() => switchDirection('in')}>
          Add money
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label htmlFor="amount">Amount (৳)</label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="category">{kind === 'expense' ? 'Category' : 'Source'}</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{kind === 'expense' ? 'Uncategorized' : 'Unspecified'}</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="payment">Payment</label>
          <select id="payment" value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">Note (optional)</label>
        <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Lunch at office" />
      </div>

      {error && <div className="error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Saving…' : direction === 'out' ? 'Add expense' : 'Add money'}
      </button>
    </form>
  );
}
