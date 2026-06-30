import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import TransactionList from '../components/TransactionList';
import { formatBDT } from '../lib/format';

export default function Search() {
  const { transactions, categoriesById, removeTransaction } = useFinance();
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return [];
    return transactions.filter((t) => {
      const cat = t.category_id ? (categoriesById[t.category_id]?.name ?? '') : '';
      const haystack = [
        t.note ?? '',
        cat,
        t.payment_method,
        t.direction === 'in' ? 'income' : 'expense',
        String(t.amount),
        t.occurred_on,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, query]);

  const net = results.reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0);

  async function onDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    await removeTransaction(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Search</h1>

      <div className="card">
        <div className="field">
          <label htmlFor="q">Search transactions</label>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="note, category, amount, payment, date…"
            autoFocus
          />
        </div>
      </div>

      {query === '' ? (
        <p className="muted">Type to search across notes, categories, amounts, payment and dates.</p>
      ) : (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--sp-2)',
            }}
          >
            <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              {results.length} {results.length === 1 ? 'match' : 'matches'}
            </span>
            {results.length > 0 && (
              <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                Net:{' '}
                <strong style={{ color: net < 0 ? 'var(--expense)' : 'var(--income)' }}>
                  {formatBDT(net)}
                </strong>
              </span>
            )}
          </div>
          <TransactionList items={results} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}
