import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import { formatBDT, monthStartISO } from '../lib/format';
import { downloadCSV } from '../lib/csv';
import './SummaryPanel.css';

type Scope = 'month' | 'all';

export default function SummaryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { transactions, categoriesById, balance, spentThisMonth } = useFinance();
  const [scope, setScope] = useState<Scope>('month');
  const [expensesOnly, setExpensesOnly] = useState(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const monthStart = monthStartISO();

  const inScope = useMemo(
    () =>
      transactions.filter((t) => {
        if (scope === 'month' && t.occurred_on < monthStart) return false;
        if (expensesOnly && t.direction !== 'out') return false;
        return true;
      }),
    [transactions, scope, expensesOnly, monthStart],
  );

  const catName = (id: string | null) =>
    id ? (categoriesById[id]?.name ?? 'Uncategorized') : 'Uncategorized';

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of inScope) {
      if (t.direction !== 'out') continue;
      m.set(catName(t.category_id), (m.get(catName(t.category_id)) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inScope]);

  const scopeSpent = useMemo(
    () => inScope.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0),
    [inScope],
  );

  function onDownload() {
    const expenses = inScope.filter((t) => t.direction === 'out');
    const rows: string[][] = [
      ['Date', 'Category', 'Payment', 'Amount (BDT)', 'Note'],
      ...expenses.map((t) => [
        t.occurred_on,
        catName(t.category_id),
        t.payment_method,
        t.amount.toFixed(2),
        t.note ?? '',
      ]),
    ];
    downloadCSV(`xpense-expenses-${scope}.csv`, rows);
  }

  return (
    <div className={`summary-overlay${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="summary-scrim" onClick={onClose} />
      <aside className="summary-panel" role="dialog" aria-modal="true" aria-label="Summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Summary</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close summary">
            ✕
          </button>
        </div>

        <div className="summary-headline">
          <div className="summary-stat">
            <div className="label">Spent this month</div>
            <div className="value amount-out">{formatBDT(spentThisMonth)}</div>
          </div>
          <div className="summary-stat">
            <div className="label">Remaining money</div>
            <div className="value" style={{ color: balance < 0 ? 'var(--danger)' : 'var(--income)' }}>
              {formatBDT(balance)}
            </div>
          </div>
        </div>

        <div className="summary-toggles">
          <div className="seg" role="group" aria-label="Scope">
            <button className={scope === 'month' ? 'active' : ''} onClick={() => setScope('month')}>
              This month
            </button>
            <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>
              All time
            </button>
          </div>
          <label style={{ display: 'inline-flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={expensesOnly}
              onChange={(e) => setExpensesOnly(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Expenses only
          </label>
        </div>

        <div>
          <div className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
            Expenses by category{scope === 'month' ? ' (this month)' : ' (all time)'} ·{' '}
            {formatBDT(scopeSpent)}
          </div>
          {byCategory.length === 0 ? (
            <p className="muted">No expenses in this range.</p>
          ) : (
            byCategory.map(([name, total]) => (
              <div className="breakdown-row" key={name}>
                <span>{name}</span>
                <span className="amount-out">{formatBDT(total)}</span>
              </div>
            ))
          )}
        </div>

        <button className="btn btn-primary" onClick={onDownload} disabled={byCategory.length === 0}>
          Download expenses (CSV)
        </button>
      </aside>
    </div>
  );
}
