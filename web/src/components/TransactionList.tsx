import { useFinance } from '../data/FinanceProvider';
import { formatBDT, formatDate } from '../lib/format';
import { categoryColor } from '../lib/colors';
import type { Transaction } from '../types/db';
import './TransactionList.css';

export default function TransactionList({
  items,
  onDelete,
}: {
  items: Transaction[];
  onDelete?: (id: string) => void;
}) {
  const { categoriesById } = useFinance();
  if (items.length === 0) return <p className="muted">No transactions to show.</p>;

  return (
    <div>
      {items.map((t) => {
        const category = t.category_id ? categoriesById[t.category_id] : undefined;
        const name = category?.name ?? 'Uncategorized';
        const dot = category ? categoryColor(category) : 'var(--border)';
        return (
          <div key={t.id} className="tx-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: dot,
                  flex: '0 0 auto',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div className="tx-title">
                  {name}
                  {t.note ? <span className="muted"> · {t.note}</span> : null}
                </div>
                <div className="muted tx-meta">
                  {formatDate(t.occurred_on)} · {t.payment_method}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span className={`tx-amount ${t.direction === 'in' ? 'amount-in' : 'amount-out'}`}>
                {t.direction === 'in' ? '+' : '−'}
                {formatBDT(t.amount)}
              </span>
              {onDelete && (
                <button className="btn btn-danger" onClick={() => onDelete(t.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
