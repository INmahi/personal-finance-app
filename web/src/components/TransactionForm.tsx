import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { Direction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';
import { resolveCategoryInput } from '../lib/category';
import CompactDate from './CompactDate';
import CategoryField from './CategoryField';
import { IconNote } from './icons';

export default function TransactionForm() {
  const { categories, addTransaction } = useFinance();
  const [direction, setDirection] = useState<Direction>('out');
  const [categoryName, setCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = direction === 'out' ? 'expense' : 'income';
  const catNames = useMemo(
    () => categories.filter((c) => c.kind === kind).map((c) => c.name),
    [categories, kind],
  );

  function switchDirection(d: Direction) {
    setDirection(d);
    setCategoryName('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    const resolved = resolveCategoryInput(categoryName, kind, categories);

    setBusy(true);
    try {
      await addTransaction({
        direction,
        amount: amt,
        occurred_on: date,
        category_id: resolved.category_id,
        category_label: resolved.category_label,
        payment_method: payment,
        note: note.trim() || null,
      });
      setAmount('');
      setNote('');
      setNoteOpen(false);
      setCategoryName('');
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

      <div className="entry-grid">
        <div className="field span-2">
          <label htmlFor="category">{kind === 'expense' ? 'Category' : 'Source'}</label>
          <CategoryField
            value={categoryName}
            onChange={setCategoryName}
            options={catNames}
            placeholder={kind === 'expense' ? 'type or pick a category' : 'type or pick a source'}
            ariaLabel={kind === 'expense' ? 'Category' : 'Source'}
          />
        </div>

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
          <label>Date</label>
          <CompactDate value={date} onChange={setDate} ariaLabel="Date" />
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

        <div className="field">
          <label>{noteOpen ? 'Note' : ' '}</label>
          {noteOpen ? (
            // eslint-disable-next-line jsx-a11y/no-autofocus
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" autoFocus aria-label="Note" />
          ) : (
            <button type="button" className="btn note-open-btn" onClick={() => setNoteOpen(true)}>
              <IconNote /> Add note
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Saving…' : direction === 'out' ? 'Add expense' : 'Add money'}
      </button>
    </form>
  );
}
