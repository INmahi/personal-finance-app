import { useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { Direction, NewTransaction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';

interface Draft {
  direction: Direction;
  amount: string;
  date: string;
  categoryId: string;
  payment: PaymentMethod;
  note: string;
}

function blank(prev?: Draft): Draft {
  // New rows inherit date / type / payment from the previous row for fast entry.
  return {
    direction: prev?.direction ?? 'out',
    amount: '',
    date: prev?.date ?? todayISO(),
    categoryId: '',
    payment: prev?.payment ?? 'cash',
    note: '',
  };
}

export default function BatchAddForm({ onDone }: { onDone?: () => void }) {
  const { categories, addTransactions } = useFinance();
  const [rows, setRows] = useState<Draft[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Draft>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, blank(rs[rs.length - 1])]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));
  }
  function catsFor(d: Direction) {
    return categories.filter((c) => c.kind === (d === 'out' ? 'expense' : 'income'));
  }

  async function saveAll() {
    setError(null);
    const nonEmpty = rows.filter((r) => !(r.amount.trim() === '' && r.note.trim() === ''));
    if (nonEmpty.length === 0) {
      setError('Add at least one row with an amount.');
      return;
    }
    const inputs: NewTransaction[] = [];
    for (let i = 0; i < nonEmpty.length; i++) {
      const r = nonEmpty[i];
      const amt = Number(r.amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setError(`Row ${i + 1}: enter an amount greater than 0.`);
        return;
      }
      inputs.push({
        direction: r.direction,
        amount: amt,
        occurred_on: r.date,
        category_id: r.categoryId || null,
        payment_method: r.payment,
        note: r.note.trim() || null,
      });
    }
    setBusy(true);
    try {
      await addTransactions(inputs);
      setRows([blank()]);
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Batch add</strong>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>

      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--sp-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
              Row {i + 1}
            </span>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1}
              aria-label={`Remove row ${i + 1}`}
              style={{ padding: '4px 10px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-2)' }}>
            <div className="field">
              <label>Type</label>
              <select
                value={r.direction}
                onChange={(e) => update(i, { direction: e.target.value as Direction, categoryId: '' })}
              >
                <option value="out">Expense</option>
                <option value="in">Income</option>
              </select>
            </div>
            <div className="field">
              <label>Amount (৳)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={r.date} onChange={(e) => update(i, { date: e.target.value })} />
            </div>
            <div className="field">
              <label>{r.direction === 'out' ? 'Category' : 'Source'}</label>
              <select value={r.categoryId} onChange={(e) => update(i, { categoryId: e.target.value })}>
                <option value="">{r.direction === 'out' ? 'Uncategorized' : 'Unspecified'}</option>
                {catsFor(r.direction).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Payment</label>
              <select
                value={r.payment}
                onChange={(e) => update(i, { payment: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Note</label>
              <input value={r.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="optional" />
            </div>
          </div>
        </div>
      ))}

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <button className="btn" type="button" onClick={addRow}>
          + Add row
        </button>
        <button className="btn btn-primary" type="button" onClick={saveAll} disabled={busy}>
          {busy ? 'Saving…' : `Save all (${rows.length})`}
        </button>
      </div>
    </div>
  );
}
