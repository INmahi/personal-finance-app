import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { PAYMENT_METHODS } from '../types/db';
import type { NewTransaction, PaymentMethod } from '../types/db';
import { todayISO } from '../lib/format';
import { resolveCategoryInput } from '../lib/category';
import CompactDate from './CompactDate';
import { IconNote } from './icons';
import './BatchAddForm.css';

interface Draft {
  categoryName: string;
  amount: string;
  date: string;
  payment: PaymentMethod;
  note: string;
  noteOpen: boolean;
}

function blank(prev?: Draft): Draft {
  return {
    categoryName: '',
    amount: '',
    date: prev?.date ?? todayISO(),
    payment: prev?.payment ?? 'cash',
    note: '',
    noteOpen: false,
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
    const nonEmpty = rows.filter(
      (r) => !(r.amount.trim() === '' && r.note.trim() === '' && r.categoryName.trim() === ''),
    );
    if (nonEmpty.length === 0) {
      setError('Add at least one row with an amount.');
      return;
    }
    for (let i = 0; i < nonEmpty.length; i++) {
      const amt = Number(nonEmpty[i].amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setError(`Row ${i + 1}: enter an amount greater than 0.`);
        return;
      }
    }

    setBusy(true);
    try {
      const inputs: NewTransaction[] = nonEmpty.map((r) => {
        const resolved = resolveCategoryInput(r.categoryName, 'expense', categories);
        return {
          direction: 'out',
          amount: Number(r.amount),
          occurred_on: r.date,
          category_id: resolved.category_id,
          category_label: resolved.category_label,
          payment_method: r.payment,
          note: r.note.trim() || null,
        };
      });

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
    <div className="batch">
      <div className="batch-titlebar">
        <strong>Batch add expenses</strong>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>

      <div className="sheet-scroll">
        <div className="sheet">
          <div className="sheet-head">
            <span>Spent on</span>
            <span>Amount (৳)</span>
            <span>Date</span>
            <span>Payment</span>
            <span />
            <span />
          </div>

          {rows.map((r, i) => (
            <div className="sheet-row" key={i}>
              <input
                list="batch-cat-list"
                value={r.categoryName}
                onChange={(e) => update(i, { categoryName: e.target.value })}
                placeholder="Pick or type…"
                autoComplete="off"
                aria-label={`Row ${i + 1} spent on`}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                placeholder="0.00"
                aria-label={`Row ${i + 1} amount`}
              />
              <CompactDate value={r.date} onChange={(v) => update(i, { date: v })} ariaLabel={`Row ${i + 1} date`} />
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
              <button
                className={'cell-btn' + (r.noteOpen || r.note ? ' active' : '')}
                type="button"
                onClick={() => update(i, { noteOpen: !r.noteOpen })}
                aria-label={`Row ${i + 1} note`}
                title="Note"
              >
                <IconNote />
              </button>
              <button
                className="cell-btn cell-last"
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                aria-label={`Remove row ${i + 1}`}
              >
                ✕
              </button>

              {r.noteOpen && (
                <input
                  className="note-cell"
                  value={r.note}
                  onChange={(e) => update(i, { note: e.target.value })}
                  placeholder="Note (optional)"
                  aria-label={`Row ${i + 1} note text`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <datalist id="batch-cat-list">
        {expenseCats.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

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
