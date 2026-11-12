// Small helpers for the Admin Audio page. Plain JavaScript (no React): every function only
// uses its arguments, so they can be tested with `npm test`.
//   regions: the list from GET /api/regions, in the API's order ([{ code, name, ... }])
//   audio:   the list from GET /api/admin/audio ([{ region_code, has_audio, ... }]), or null while loading

// The name to show for a region code. A code the region list does not know shows as itself.
export function regionLabel(regions, code) {
  return (regions ?? []).find((r) => r.code === code)?.name || code;
}

// One coverage row per region of the API, in the API's order: how many words have audio,
// how many more the listening game needs, and whether that is enough.
export function coverageByRegion(regions, audio, needed) {
  return (regions ?? []).map((r) => {
    const count = (audio ?? []).filter((w) => w.region_code === r.code && w.has_audio).length;
    const missing = Math.max(0, needed - count);
    return { code: r.code, name: r.name || r.code, count, missing, ready: missing === 0 };
  });
}

// The filter chips: "All", then every region of the API, then any region code that only the audio
// list knows (so its words can still be filtered, labelled with the code).
export function filterOptions(regions, audio) {
  const known = (regions ?? []).map((r) => ({ code: r.code, label: r.name || r.code }));
  const seen = new Set(known.map((o) => o.code));
  const extra = [];
  for (const w of audio ?? []) {
    if (!seen.has(w.region_code)) {
      seen.add(w.region_code);
      extra.push({ code: w.region_code, label: w.region_code });
    }
  }
  return [{ code: 'all', label: 'All' }, ...known, ...extra];
}
