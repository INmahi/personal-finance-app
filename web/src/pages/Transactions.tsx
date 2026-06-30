import { useMemo, useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { formatBDT } from '../lib/format';
import type { Direction } from '../types/db';

export default function Transactions() {
  const { loading, error, transactions, categories, removeTransaction } = useFinance();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [dir, setDir] = useState<'all' | Direction>('all');

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (dir !== 'all' && t.direction !== dir) return false;
        if (cat && t.category_id !== cat) return false;
        if (q && !(t.note ?? '').toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [transactions, dir, cat, q],
  );

  const net = filtered.reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0);

  async function onDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    await removeTransaction(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Transactions</h1>
      {error && <div className="error">{error}</div>}

      <TransactionForm />

      <div className="card">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <div className="field">
            <label htmlFor="search">Search note</label>
            <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. lunch" />
          </div>
          <div className="field">
            <label htmlFor="filter-dir">Type</label>
            <select id="filter-dir" value={dir} onChange={(e) => setDir(e.target.value as 'all' | Direction)}>
              <option value="all">All</option>
              <option value="out">Expense</option>
              <option value="in">Income</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-cat">Category</label>
            <select id="filter-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sp-2)',
          }}
        >
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Net:{' '}
            <strong style={{ color: net < 0 ? 'var(--expense)' : 'var(--income)' }}>
              {formatBDT(net)}
            </strong>
          </span>
        </div>

        {loading ? <p className="muted">Loading…</p> : <TransactionList items={filtered} onDelete={onDelete} />}
      </div>
    </div>
  );
}
