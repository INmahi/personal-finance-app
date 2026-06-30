import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import SummaryPanel from './SummaryPanel';
import './AppShell.css';

export default function AppShell() {
  const { signOut } = useAuth();
  const [summaryOpen, setSummaryOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          Xpense<span>Tracker</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/transactions" className={linkClass}>
            Transactions
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
          <NavLink to="/categories" className={linkClass}>
            Categories
          </NavLink>
          <NavLink to="/fixed" className={linkClass}>
            Fixed
          </NavLink>
        </nav>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setSummaryOpen(true)}>
            Summary
          </button>
          <button className="btn btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
}
