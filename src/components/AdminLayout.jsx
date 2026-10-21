import { NavLink, Outlet } from 'react-router-dom';

// Admin is one tab with four scrollable sub-tabs (wireframe page 13). Same routes as the site map.
const SUB_TABS = [
  ['/admin/approvals', 'Pending'],
  ['/admin/words', 'Words'],
  ['/admin/regions', 'Regions'],
  ['/admin/audio', 'Audio'],
];

export default function AdminLayout() {
  return (
    <>
      <p className="kicker">Admin</p>
      <nav className="subtabs" aria-label="Admin">
        {SUB_TABS.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
      </nav>
      <Outlet />
    </>
  );
}
