import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Guard from './components/Guard';
import AdminLayout from './components/AdminLayout';
import Placeholder from './pages/Placeholder';
import SignIn from './pages/SignIn';
import Profile from './pages/Profile';
import Suggest from './pages/Suggest';               // D: Suggest a word
import AdminPending from './pages/AdminPending';     // D: Admin pending queue
import AdminAudio from './pages/AdminAudio';         // C: Admin audio
import WordList from './pages/WordList';             // B: word list of one region
import WordPond from './games/WordPond';             // C: Word Pond matching game
import JeepneyStop from './games/JeepneyStop';       // C: Jeepney stop listening game
import NotFound from './pages/NotFound';
import { canSuggest, isAdmin, isSignedIn } from './auth/roles';

// Routes follow the site map (DEC-38). Owners replace the element of their own route, not the route itself.
// 'approvals' (D) and 'audio' (C) now have their own routes below, so they are no longer in this list.
const ADMIN_PAGES = [
  ['words', 'Admin: words', 'B'],
  ['regions', 'Admin: regions', 'B'],
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
        <Route path="regions/:code" element={<WordList />} />
        <Route path="signin" element={<SignIn />} />

        {/* Signed-in users */}
        <Route path="profile" element={<Profile />} />   {/* checks sign-in itself */}
        <Route path="passport" element={signedIn('Passport', 'C')} />
        <Route path="play/matching/:region" element={
          <Guard allow={isSignedIn}><WordPond /></Guard>} />
        <Route path="play/listening/:region" element={
          <Guard allow={isSignedIn}><JeepneyStop /></Guard>} />

        {/* Contributors and Admins (DEC-60) */}
        <Route path="submit" element={
          <Guard allow={canSuggest}><Suggest /></Guard>} />

        {/* Admins only: one tab, four sub-tabs (DEC-62) */}
        <Route path="admin" element={<Guard allow={isAdmin}><AdminLayout /></Guard>}>
          <Route index element={<Navigate to="approvals" replace />} />
          <Route path="approvals" element={<AdminPending />} />
          <Route path="audio" element={<AdminAudio />} />
          {ADMIN_PAGES.map(([path, title, owner]) => (
            <Route key={path} path={path} element={<Placeholder title={title} owner={owner} />} />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}