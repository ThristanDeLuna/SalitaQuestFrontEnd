import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';

// The Google button only works inside GoogleOAuthProvider, which main.jsx adds when a client id is set.
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Welcome / sign-in screen (wireframe page 4). Google only; a new account is a Learner.
export default function SignIn() {
  const { user, signIn, devSignIn, reportError } = useAuth();
  const location = useLocation();
  const [devRole, setDevRole] = useState('learner');

  // Already signed in (or just signed in): go back to where the visitor was heading.
  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  return (
    <section className="welcome">
      {/* Decorative boat; it only bobs when the user has not asked for reduced motion. */}
      <svg className="boat" viewBox="0 0 200 90" aria-hidden="true" focusable="false">
        <path d="M70 60 L130 60 L118 76 L82 76 Z" fill="#25184e" />
        <path d="M100 18 L100 58 L132 58 Z" fill="#ffb59e" />
        <path d="M0 80 Q25 70 50 80 T100 80 T150 80 T200 80 V90 H0 Z" fill="#cee5f5" />
      </svg>
      <h1>Salita Quest</h1>
      <p>Sail the islands. Catch words. Collect stamps.</p>

      {GOOGLE_ENABLED ? (
        <GoogleLogin text="continue_with"
                     onSuccess={(r) => signIn(r.credential)}
                     onError={() => reportError('Google sign-in failed. Please try again.')} />
      ) : (
        <>
          <button type="button" className="btn primary" disabled>Continue with Google</button>
          <p className="muted">Google sign-in is not set up yet.</p>
        </>
      )}

      <p><Link to="/">Or keep browsing as a visitor</Link></p>

      {import.meta.env.DEV && (
        <div className="dev">
          <label htmlFor="dev-role">Dev sign-in (local only)</label>
          <select id="dev-role" value={devRole} onChange={(e) => setDevRole(e.target.value)}>
            <option value="learner">learner</option>
            <option value="contributor">contributor</option>
            <option value="admin">admin</option>
          </select>
          <button type="button" className="btn" onClick={() => devSignIn(devRole)}>Sign in as {devRole}</button>
        </div>
      )}
    </section>
  );
}
