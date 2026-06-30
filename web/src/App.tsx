import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Login from './auth/Login';
import AppShell from './components/AppShell';
import { FinanceProvider } from './data/FinanceProvider';
import Home from './pages/Home';
import Transactions from './pages/Transactions';

export default function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <FinanceProvider>
              <AppShell />
            </FinanceProvider>
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
