import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Forbidden from './Forbidden';

// A visitor goes to sign in (and comes back afterwards); a signed-in user with the wrong role sees "Not for this account".
// This is tidiness, not security: the API refuses the data anyway.
export default function Guard({ allow, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="muted">Loading…</p>;   // avoid a flash while the saved token is checked
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (!allow(user)) return <Forbidden />;
  return children;
}
