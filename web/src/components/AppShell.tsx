import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import SummaryPanel from './SummaryPanel';
import Logo from './Logo';
import './AppShell.css';

export default function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const tabClass = ({ isActive }: { isActive: boolean }) => 'tab' + (isActive ? ' active' : '');

  const tabs = (
    <>
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
    </>
  );

  const actions = (
    <>
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
    </>
  );

  return (
    <div className="shell">
      <header className="appheader">
        <div className="topbar">
          <button
            className="brand-btn"
            onClick={() => navigate('/')}
            aria-label="Go to home"
          >
            <Logo />
          </button>

          <div className="bar-actions">{actions}</div>

          <button
            className={'hamburger' + (menuOpen ? ' open' : '')}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="ham-inner" />
          </button>
        </div>

        <nav className="tabs desktop-tabs">{tabs}</nav>

        <div className={'drawer' + (menuOpen ? ' open' : '')}>
          <div className="drawer-inner">
            <nav className="tabs drawer-tabs">{tabs}</nav>
            <div className="drawer-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/search')}>
                🔍 Search
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/reports')}>
                ⚙ Filter
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setMenuOpen(false);
                  setSummaryOpen(true);
                }}
              >
                Summary
              </button>
              <button className="btn btn-ghost" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="route-view" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
}
