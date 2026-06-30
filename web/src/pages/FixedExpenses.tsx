import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { formatBDT } from '../lib/format';
import type { FixedExpense } from '../types/db';

function FixedRow({ f }: { f: FixedExpense }) {
  const { categoriesById, editFixedExpense, removeFixedExpense } = useFinance();
  const catName = f.category_id ? (categoriesById[f.category_id]?.name ?? '—') : '—';

  async function onEdit() {
    const name = window.prompt('Name', f.name)?.trim();
    if (!name) return;
    const amountStr = window.prompt('Monthly amount (৳)', String(f.amount));
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Amount must be greater than 0.');
      return;
    }
    await editFixedExpense(f.id, { name, amount });
  }

  return (
    <div className="tx-row">
      <div>
        <div className="tx-title">
          {f.name} {!f.active && <span className="muted">(paused)</span>}
        </div>
        <div className="muted tx-meta">{catName}{f.note ? ` · ${f.note}` : ''}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <span className="tx-amount amount-out">{formatBDT(f.amount)}</span>
        <button className="btn btn-ghost" onClick={() => void editFixedExpense(f.id, { active: !f.active })}>
          {f.active ? 'Pause' : 'Resume'}
        </button>
        <button className="btn btn-ghost" onClick={onEdit}>
          Edit
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm(`Delete "${f.name}"?`)) void removeFixedExpense(f.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function FixedExpenses() {
  const { fixedExpenses, fixedMonthlyTotal, categories, addFixedExpense, loading, error } = useFinance();
  const expenseCats = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = name.trim();
    const amt = Number(amount);
    if (!trimmed) {
      setFormError('Enter a name.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setFormError('Enter an amount greater than 0.');
      return;
    }
    setBusy(true);
    try {
      await addFixedExpense({
        name: trimmed,
        amount: amt,
        category_id: categoryId || null,
        note: note.trim() || null,
        active: true,
      });
      setName('');
      setAmount('');
      setNote('');
      setCategoryId('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <h1 style={{ margin: 0 }}>Fixed expenses</h1>
        <div className="muted">
          Monthly total:{' '}
          <strong className="amount-out" style={{ fontSize: 'var(--fs-lg)' }}>{formatBDT(fixedMonthlyTotal)}</strong>
        </div>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Recurring monthly commitments. Tracked separately — they do not affect your balance.
      </p>
      {error && <div className="error">{error}</div>}

      <form className="card" onSubmit={onAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label htmlFor="fx-name">Name</label>
            <input id="fx-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House rent" />
          </div>
          <div className="field">
            <label htmlFor="fx-amount">Amount (৳)</label>
            <input id="fx-amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="field">
            <label htmlFor="fx-cat">Category</label>
            <select id="fx-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">None</option>
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="fx-note">Note (optional)</label>
          <input id="fx-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {formError && <div className="error">{formError}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}>
          {busy ? 'Adding…' : 'Add fixed expense'}
        </button>
      </form>

      <div className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : fixedExpenses.length === 0 ? (
          <p className="muted">No fixed expenses yet.</p>
        ) : (
          fixedExpenses.map((f) => <FixedRow key={f.id} f={f} />)
        )}
      </div>
    </div>
  );
}
