import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { Direction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';
import { resolveCategoryInput } from '../lib/category';
import CompactDate from './CompactDate';
import { IconNote } from './icons';

export default function TransactionForm() {
  const { categories, addTransaction } = useFinance();
  const [direction, setDirection] = useState<Direction>('out');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [categoryName, setCategoryName] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = direction === 'out' ? 'expense' : 'income';
  const cats = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);

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
    setBusy(true);
    try {
      const resolved = resolveCategoryInput(categoryName, kind, categories);
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

      <div className="entry-row">
        <div className="field grow2">
          <label htmlFor="where">{kind === 'expense' ? 'Spent on' : 'Source'}</label>
          <input
            id="where"
            list="tx-cat-list"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder={kind === 'expense' ? 'Pick or type…' : 'Salary, gift…'}
            autoComplete="off"
          />
          <datalist id="tx-cat-list">
            {cats.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
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

        <div className="field shrink">
          <label>Date</label>
          <CompactDate value={date} onChange={setDate} ariaLabel="Spent on date" />
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

        <button
          type="button"
          className={'icon-btn note-toggle' + (noteOpen || note ? ' active' : '')}
          onClick={() => setNoteOpen((o) => !o)}
          aria-label={noteOpen ? 'Hide note' : 'Add note'}
          title="Note"
        >
          <IconNote />
        </button>
      </div>

      {noteOpen && (
        <div className="field">
          <label htmlFor="note">Note</label>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. with friends"
            autoFocus
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Saving…' : direction === 'out' ? 'Add expense' : 'Add money'}
      </button>
    </form>
  );
}
