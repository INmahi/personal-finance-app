import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { NewTransaction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';
import './BatchAddForm.css';

interface Draft {
  amount: string;
  date: string;
  categoryId: string;
  payment: PaymentMethod;
  note: string;
}

function blank(prev?: Draft): Draft {
  // New rows inherit date / payment from the previous row for fast entry.
  return {
    amount: '',
    date: prev?.date ?? todayISO(),
    categoryId: '',
    payment: prev?.payment ?? 'cash',
    note: '',
  };
}

export default function BatchAddForm({ onDone }: { onDone?: () => void }) {
  const { categories, addTransactions } = useFinance();
  const expenseCats = useMemo(() => categories.filter((c) => c.kind === 'expense'), [categories]);
  const [rows, setRows] = useState<Draft[]>([blank(), blank(), blank()]);
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
        direction: 'out',
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
      setRows([blank(), blank(), blank()]);
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
        <strong>Batch add expenses</strong>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>

      <div className="batch-head">
        <span>Amount (৳)</span>
        <span>Date</span>
        <span>Category</span>
        <span>Payment</span>
        <span>Note</span>
        <span />
      </div>

      {rows.map((r, i) => (
        <div className="batch-row" key={i}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={r.amount}
            onChange={(e) => update(i, { amount: e.target.value })}
            placeholder="0.00"
            aria-label={`Row ${i + 1} amount`}
          />
          <input
            type="date"
            value={r.date}
            onChange={(e) => update(i, { date: e.target.value })}
            aria-label={`Row ${i + 1} date`}
          />
          <select
            value={r.categoryId}
            onChange={(e) => update(i, { categoryId: e.target.value })}
            aria-label={`Row ${i + 1} category`}
          >
            <option value="">Uncategorized</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={r.payment}
            onChange={(e) => update(i, { payment: e.target.value as PaymentMethod })}
            aria-label={`Row ${i + 1} payment`}
          >
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className="note-cell"
            value={r.note}
            onChange={(e) => update(i, { note: e.target.value })}
            placeholder="Note (optional)"
            aria-label={`Row ${i + 1} note`}
          />
          <button
            className="btn btn-ghost rm"
            type="button"
            onClick={() => removeRow(i)}
            disabled={rows.length === 1}
            aria-label={`Remove row ${i + 1}`}
          >
            ✕
          </button>
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
