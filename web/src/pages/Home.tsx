import { Link } from 'react-router-dom';
import { useFinance } from '../data/FinanceProvider';
import { formatBDT } from '../lib/format';
import TransactionList from '../components/TransactionList';

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, marginTop: 'var(--sp-2)', color }}>
        {value}
      </div>
    </div>
  );
}

export default function Home() {
  const { loading, error, transactions, balance, spentThisMonth, incomeThisMonth } = useFinance();

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      {error && <div className="error">{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--sp-4)',
        }}
      >
        <Stat
          label="Balance (remaining money)"
          value={formatBDT(balance)}
          color={balance < 0 ? 'var(--danger)' : 'var(--income)'}
        />
        <Stat label="Spent this month" value={formatBDT(spentThisMonth)} color="var(--expense)" />
        <Stat label="Income this month" value={formatBDT(incomeThisMonth)} color="var(--income)" />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Recent</h2>
          <Link to="/transactions" className="btn">
            View all
          </Link>
        </div>
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <TransactionList items={transactions.slice(0, 6)} />
        </div>
      </div>
    </div>
  );
}
