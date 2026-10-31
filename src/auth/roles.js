// Who may see what (DEC-62). Hiding a tab is only convenience: the API checks every request.
export const isSignedIn = (user) => Boolean(user);
// Learners cannot suggest words (DEC-60), so only Contributors and Admins get the Suggest tab.
export const canSuggest = (user) => user?.role === 'contributor' || user?.role === 'admin';
export const isAdmin = (user) => user?.role === 'admin';

export const roleLabel = (user) =>
  user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Visitor';

// One letter for the profile circle.
export const initial = (user) => (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
