import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { errorKind } from './errors';

// Loads one game round from the API.
//   const { round, status, kind, error, attempt, again } = useRound('/api/games/matching/tagalog');
// - status: 'loading' | 'ready' | 'error'
// - kind:   errorKind(error) when status is 'error', otherwise null
// - again() throws the current round away and asks for a NEW one.
// - attempt counts the rounds asked for; a screen can use it as a React key to start fresh.
//
// Why the "cancelled" flag: every GET gives a DIFFERENT random round, and React
// StrictMode runs effects twice in development. Only the newest request for the
// current path may set state; any older answer that arrives late is ignored.
export default function useRound(path) {
  const [attempt, setAttempt] = useState(0);
  // The last answer, remembered with the path and attempt it belongs to.
  const [answer, setAnswer] = useState({ path: null, attempt: -1, round: null, error: null });

  useEffect(() => {
    let cancelled = false;
    api(path)
      .then((round) => { if (!cancelled) setAnswer({ path, attempt, round, error: null }); })
      .catch((error) => { if (!cancelled) setAnswer({ path, attempt, round: null, error }); });
    return () => { cancelled = true; };
  }, [path, attempt]);

  // Asking again changes attempt, so the old round no longer counts (see "fresh" below).
  const again = useCallback(() => setAttempt((n) => n + 1), []);

  // The answer only counts if it is for THIS path and THIS attempt; otherwise we are still loading.
  const fresh = answer.path === path && answer.attempt === attempt;
  let status = 'loading';
  if (fresh) status = answer.error ? 'error' : 'ready';

  return {
    round: status === 'ready' ? answer.round : null,
    status,
    kind: status === 'error' ? errorKind(answer.error) : null,
    error: status === 'error' ? answer.error : null,
    attempt,
    again,
  };
}
