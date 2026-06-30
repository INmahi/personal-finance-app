import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { formatBDT, monthStartISO, todayISO } from '../lib/format';
import type { PaymentMethod } from '../types/db';
import { PAYMENT_METHODS } from '../types/db';

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, marginTop: 'var(--sp-2)', color }}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span>{label}</span>
        <span className="amount-out">{formatBDT(value)}</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const { transactions, categoriesById, fixedMonthlyTotal, loading } = useFinance();
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());

  const inRange = useMemo(
    () => transactions.filter((t) => t.occurred_on >= start && t.occurred_on <= end),
    [transactions, start, end],
  );

  const expenseTotal = inRange.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const incomeTotal = inRange.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const net = incomeTotal - expenseTotal;

  const catName = (id: string | null) =>
    id ? (categoriesById[id]?.name ?? 'Uncategorized') : 'Uncategorized';

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of inRange) {
      if (t.direction !== 'out') continue;
      m.set(catName(t.category_id), (m.get(catName(t.category_id)) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange]);

  const byPayment = useMemo(() => {
    const m: Record<PaymentMethod, number> = { cash: 0, bkash: 0, bank: 0 };
    for (const t of inRange) if (t.direction === 'out') m[t.payment_method] += t.amount;
    return m;
  }, [inRange]);

  const maxCat = byCategory.length ? byCategory[0][1] : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Reports</h1>

      <div className="card" style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field">
          <label htmlFor="start">From</label>
          <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="end">To</label>
          <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <button
          className="btn"
          onClick={() => {
            setStart(monthStartISO());
            setEnd(todayISO());
          }}
        >
          This month
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--sp-4)' }}>
            <Stat label="Expenses" value={formatBDT(expenseTotal)} color="var(--expense)" />
            <Stat label="Income" value={formatBDT(incomeTotal)} color="var(--income)" />
            <Stat label="Net" value={formatBDT(net)} color={net < 0 ? 'var(--danger)' : 'var(--income)'} />
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Expenses by category</h2>
            {byCategory.length === 0 ? (
              <p className="muted">No expenses in this range.</p>
            ) : (
              byCategory.map(([name, total]) => <Bar key={name} label={name} value={total} max={maxCat} />)
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>By payment method</h2>
              {PAYMENT_METHODS.map((p) => (
                <div className="tx-row" key={p.value}>
                  <span>{p.label}</span>
                  <span className="amount-out">{formatBDT(byPayment[p.value])}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Fixed monthly (reference)</h2>
              <p className="muted" style={{ marginTop: 0 }}>Recurring commitments, not included above.</p>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }} className="amount-out">
                {formatBDT(fixedMonthlyTotal)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
