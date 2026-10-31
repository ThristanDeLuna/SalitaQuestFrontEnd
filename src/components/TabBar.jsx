import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { canSuggest, isAdmin } from '../auth/roles';

// Bottom tabs on a phone, the lavender side menu on a wide screen (DEC-62). Never more than four.
// Visitor: Map, Sign in. Learner: Map, Passport. Contributor: + Suggest. Admin: + Admin.
export default function TabBar() {
  const { user } = useAuth();

  const tabs = [{ to: '/', label: 'Map', end: true }];
  if (!user) tabs.push({ to: '/signin', label: 'Sign in' });
  else {
    tabs.push({ to: '/passport', label: 'Passport' });
    if (canSuggest(user)) tabs.push({ to: '/submit', label: 'Suggest' });
    if (isAdmin(user)) tabs.push({ to: '/admin', label: 'Admin' });   // matches every /admin/... page
  }

  return (
    <nav className="tabbar" aria-label="Main">
      <span className="tabbar-logo">Salita Quest</span>
      <ul>
        {tabs.map((t) => (
          <li key={t.to}><NavLink to={t.to} end={t.end}>{t.label}</NavLink></li>
        ))}
      </ul>
    </nav>
  );
}
