// Stars, streak and stamps come from GET /api/me/summary, which Member C builds (DEC-64).
// That endpoint does not exist yet, so this returns null and the screens simply hide those numbers.
// When it exists, fetch it here and return { stars, streak, stamps } (field names are a guess: confirm with C).
export function useSummary() {
  return null;
}
