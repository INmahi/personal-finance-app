import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import SummaryPanel from './SummaryPanel';
import './AppShell.css';

export default function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [summaryOpen, setSummaryOpen] = useState(false);

  const tabClass = ({ isActive }: { isActive: boolean }) => 'tab' + (isActive ? ' active' : '');

  return (
    <div className="shell">
      <header className="appheader">
        <div className="topbar">
          <div className="brand">
            Xpense<span>Tracker</span>
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => navigate('/search')}>
              🔍 Search
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/reports')}>
              ⚙ Filter
            </button>
            <button className="btn btn-primary" onClick={() => setSummaryOpen(true)}>
              Summary
            </button>
            <button className="btn btn-ghost" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="tabs">
          <NavLink to="/" end className={tabClass}>
            Transactions
          </NavLink>
          <NavLink to="/overview" className={tabClass}>
            Overview
          </NavLink>
          <NavLink to="/reports" className={tabClass}>
            Reports
          </NavLink>
          <NavLink to="/categories" className={tabClass}>
            Categories
          </NavLink>
          <NavLink to="/fixed" className={tabClass}>
            Fixed
          </NavLink>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
}
