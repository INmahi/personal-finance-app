import { useFinance } from '../data/FinanceProvider';
import { formatBDT, formatDate } from '../lib/format';
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
        const cat = t.category_id
          ? (categoriesById[t.category_id]?.name ?? 'Uncategorized')
          : 'Uncategorized';
        return (
          <div key={t.id} className="tx-row">
            <div>
              <div className="tx-title">
                {cat}
                {t.note ? <span className="muted"> · {t.note}</span> : null}
              </div>
              <div className="muted tx-meta">
                {formatDate(t.occurred_on)} · {t.payment_method}
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
