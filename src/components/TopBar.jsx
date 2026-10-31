import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initial } from '../auth/roles';
import { useSummary } from '../auth/useSummary';

// Top bar (wireframe page 3): logo, streak, stars and the profile circle. A visitor sees only "Sign in".
export default function TopBar() {
  const { user } = useAuth();
  const summary = useSummary();   // null until C's endpoint exists

  return (
    <header className="topbar">
      <Link to="/" className="logo">Salita Quest</Link>
      <div className="topbar-right">
        {user ? (
          <>
            {summary && <span className="chip" aria-label={`${summary.streak} day streak`}>🔥 {summary.streak}</span>}
            {summary && <span className="chip" aria-label={`${summary.stars} stars`}>★ {summary.stars}</span>}
            <Link to="/profile" className="avatar" aria-label="Profile">{initial(user)}</Link>
          </>
        ) : (
          <Link to="/signin" className="btn">Sign in</Link>
        )}
      </div>
    </header>
  );
}
