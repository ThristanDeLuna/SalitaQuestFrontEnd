import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Guard from './components/Guard';
import AdminLayout from './components/AdminLayout';
import Placeholder from './pages/Placeholder';
import SignIn from './pages/SignIn';
import Profile from './pages/Profile';
import Suggest from './pages/Suggest';          // CHANGE 1: D's screen
import NotFound from './pages/NotFound';
import { canSuggest, isAdmin, isSignedIn } from './auth/roles';

// Routes follow the site map (DEC-38). Owners replace the element of their own route, not the route itself.
const ADMIN_PAGES = [
  ['approvals', 'Pending', 'D'],
  ['words', 'Admin: words', 'B'],
  ['regions', 'Admin: regions', 'B'],
  ['audio', 'Admin: audio', 'C'],
];

const signedIn = (title, owner) => (
  <Guard allow={isSignedIn}><Placeholder title={title} owner={owner} /></Guard>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Open to everyone, read-only (DEC-46) */}
        <Route index element={<Placeholder title="Choose a region" owner="B" />} />
        <Route path="regions/:code" element={<Placeholder title="Word list" owner="B" />} />
        <Route path="signin" element={<SignIn />} />

        {/* Signed-in users */}
        <Route path="profile" element={<Profile />} />   {/* checks sign-in itself */}
        <Route path="passport" element={signedIn('Passport', 'C')} />
        <Route path="play/matching/:region" element={signedIn('Word Pond', 'C')} />
        <Route path="play/listening/:region" element={signedIn('Jeepney stop', 'C')} />

        {/* Contributors and Admins (DEC-60) */}
        <Route path="submit" element={
          <Guard allow={canSuggest}><Suggest /></Guard>} />   {/* CHANGE 2: was a Placeholder */}

        {/* Admins only: one tab, four sub-tabs (DEC-62) */}
        <Route path="admin" element={<Guard allow={isAdmin}><AdminLayout /></Guard>}>
          <Route index element={<Navigate to="approvals" replace />} />
          {ADMIN_PAGES.map(([path, title, owner]) => (
            <Route key={path} path={path} element={<Placeholder title={title} owner={owner} />} />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}