import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

// Stars, streak, regions and badges come from GET /api/me/summary (Member C, backend PR #38).
// It is fetched once here and shared, so the top bar and the Profile page never ask twice.
// This file is .js (not .jsx), so the provider uses createElement instead of JSX.
const SummaryContext = createContext({ summary: null, loading: false, error: null, reload: () => {} });
export const useSummary = () => useContext(SummaryContext);

// Number of regions the user has stamped. 0 while the summary has not arrived.
export function stampCount(summary) {
  return summary?.regions?.filter((r) => r.status === 'stamped').length ?? 0;
}

export function SummaryProvider({ children }) {
  const { user, ready } = useAuth();
  // Whose answer this is (key), for which request (round), and what came back.
  const [result, setResult] = useState({ key: null, round: -1, data: null, error: null });
  const [round, setRound] = useState(0);   // reload() bumps this to ask again

  // A visitor (or auth still checking) has no key, so nothing is fetched.
  // A different account gets a different key, so it never sees the previous account's numbers.
  const userKey = ready && user ? (user.id ?? user.email) : null;

  useEffect(() => {
    if (!userKey) return undefined;
    // Set when the user changes, signs out, reload() starts a newer request,
    // or StrictMode re-runs the effect: the old answer is then ignored.
    let cancelled = false;
    api('/api/me/summary')
      .then((data) => {
        if (!cancelled) setResult({ key: userKey, round, data, error: null });
      })
      .catch((e) => {
        // Keep this user's old summary on screen and just remember the status. Never throws into React.
        if (!cancelled) {
          setResult((prev) => ({
            key: userKey, round, data: prev.key === userKey ? prev.data : null, error: e.status ?? 0,
          }));
        }
      });
    return () => { cancelled = true; };
  }, [userKey, round]);

  // reload() keeps the old summary on screen while it asks again (no flicker).
  const reload = useCallback(() => setRound((r) => r + 1), []);

  // Everything below is worked out from the stored answer, so sign-out hides it at once.
  const mine = userKey !== null && result.key === userKey;
  const value = {
    summary: mine ? result.data : null,                    // null until the first answer
    error: mine ? result.error : null,                     // the failing HTTP status (0 = no answer), or null
    loading: userKey !== null && !(mine && result.round === round),
    reload,
  };
  return createElement(SummaryContext.Provider, { value }, children);
}
