import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { formatBDT, monthStartISO, todayISO } from '../lib/format';
import { txCategoryColor, txCategoryName } from '../lib/category';
import TransactionList from '../components/TransactionList';
import type { Direction, PaymentMethod } from '../types/db';
import { PAYMENT_METHODS } from '../types/db';

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, marginTop: 'var(--sp-2)', color }}>{value}</div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          {label}
        </span>
        <span className="amount-out">{formatBDT(value)}</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const { transactions, categories, categoriesById, fixedMonthlyTotal, loading } = useFinance();
  const [start, setStart] = useState(monthStartISO());
  const [end, setEnd] = useState(todayISO());
  const [dir, setDir] = useState<'all' | Direction>('all');
  const [cat, setCat] = useState('');
  const [pay, setPay] = useState<'all' | PaymentMethod>('all');

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (t.occurred_on < start || t.occurred_on > end) return false;
        if (dir !== 'all' && t.direction !== dir) return false;
        if (cat && t.category_id !== cat) return false;
        if (pay !== 'all' && t.payment_method !== pay) return false;
        return true;
      }),
    [transactions, start, end, dir, cat, pay],
  );

  const expenseTotal = filtered.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const incomeTotal = filtered.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const net = incomeTotal - expenseTotal;

  const byCategory = useMemo(() => {
    const m = new Map<string, { name: string; total: number; color: string }>();
    for (const t of filtered) {
      if (t.direction !== 'out') continue;
      const name = txCategoryName(t, categoriesById);
      const key = name.toLowerCase();
      const color = txCategoryColor(t, categoriesById);
      const cur = m.get(key);
      if (cur) cur.total += t.amount;
      else m.set(key, { name, total: t.amount, color });
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const byPayment = useMemo(() => {
    const m: Record<PaymentMethod, number> = { cash: 0, bkash: 0, bank: 0 };
    for (const t of filtered) if (t.direction === 'out') m[t.payment_method] += t.amount;
    return m;
  }, [filtered]);

  const maxCat = byCategory.length ? byCategory[0].total : 0;

  function thisMonth() {
    setStart(monthStartISO());
    setEnd(todayISO());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Reports &amp; filters</h1>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label htmlFor="start">From</label>
            <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="end">To</label>
            <input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="r-dir">Type</label>
            <select id="r-dir" value={dir} onChange={(e) => setDir(e.target.value as 'all' | Direction)}>
              <option value="all">All</option>
              <option value="out">Expense</option>
              <option value="in">Income</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="r-cat">Category</label>
            <select id="r-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="r-pay">Payment</label>
            <select id="r-pay" value={pay} onChange={(e) => setPay(e.target.value as 'all' | PaymentMethod)}>
              <option value="all">All</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn" onClick={thisMonth} style={{ alignSelf: 'flex-start' }}>
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
              <p className="muted">No expenses match these filters.</p>
            ) : (
              byCategory.map((c) => <Bar key={c.name} label={c.name} value={c.total} max={maxCat} color={c.color} />)
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

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Matching transactions ({filtered.length})</h2>
            <TransactionList items={filtered} />
          </div>
        </>
      )}
    </div>
  );
}
