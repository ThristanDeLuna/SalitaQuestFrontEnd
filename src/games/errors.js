// Turns an error from api() (src/api/client.js) into one short "kind" and a friendly message.
// api() throws errors that carry .status (the HTTP status, 0 = no answer at all)
// and sometimes .reason (the server's 403 reason). Both games show their errors
// through these two functions, so the same problem always gets the same words.
// Plain JavaScript on purpose (no React): it can be tested with `npm test`.

// Which kind of problem is this? Returns one of:
// 'coming_soon' | 'locked' | 'not_found' | 'offline' | 'server' | 'invalid' | 'other'
export function errorKind(err) {
  const status = err?.status;
  const reason = err?.reason;
  if (status === 403 && reason === 'coming_soon') return 'coming_soon'; // not enough words or audio yet
  if (status === 403 && reason === 'locked') return 'locked';           // soft lock: earn a stamp first
  if (status === 404) return 'not_found';                                // unknown region code
  if (status === 0) return 'offline';                                    // server unreachable
  if (status === 422) return 'invalid';                                  // the server refused our answers
  if (typeof status === 'number' && status >= 500) return 'server';      // the server broke
  return 'other';  // anything else, e.g. 401 after the refresh failed, or a 403 with no reason
}

// Friendly text for each kind. Never shows raw error text or stack traces.
const MESSAGES = {
  coming_soon: 'This region is coming soon. It opens when it has enough words and recordings.',
  locked: 'This region is locked. Earn a stamp in a region you started to open another one.',
  not_found: 'We could not find that region.',
  offline: 'Cannot reach the server. Check your connection and try again.',
  server: 'The server had a problem. Please try again.',
  invalid: 'The server did not accept these answers.',
  other: 'Something went wrong. Please try again.',
};

export function errorMessage(kind) {
  return MESSAGES[kind] ?? MESSAGES.other;
}
