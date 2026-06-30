import { useState } from 'react';
import { useFinance } from '../data/FinanceProvider';
import TransactionForm from '../components/TransactionForm';
import BatchAddForm from '../components/BatchAddForm';
import TransactionList from '../components/TransactionList';
import { formatBDT } from '../lib/format';

export default function Transactions() {
  const { loading, error, transactions, removeTransaction } = useFinance();
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  const net = transactions.reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0);

  async function onDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    await removeTransaction(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <h1 style={{ margin: 0 }}>Transactions</h1>
      {error && <div className="error">{error}</div>}

      <div className="seg" role="group" aria-label="Add mode" style={{ alignSelf: 'flex-start' }}>
        <button
          type="button"
          className={mode === 'single' ? 'active' : ''}
          onClick={() => setMode('single')}
        >
          Single
        </button>
        <button
          type="button"
          className={mode === 'batch' ? 'active' : ''}
          onClick={() => setMode('batch')}
        >
          Batch add
        </button>
      </div>

      {mode === 'single' ? <TransactionForm /> : <BatchAddForm onDone={() => setMode('single')} />}

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
            {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
          </span>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Net:{' '}
            <strong style={{ color: net < 0 ? 'var(--expense)' : 'var(--income)' }}>
              {formatBDT(net)}
            </strong>
          </span>
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <TransactionList items={transactions} onDelete={onDelete} />
        )}
      </div>

      <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
        Looking for something? Use <strong>Search</strong> in the top bar, or <strong>Filter</strong>{' '}
        (Reports) to slice by date, category, type, and payment.
      </p>
    </div>
  );
}
