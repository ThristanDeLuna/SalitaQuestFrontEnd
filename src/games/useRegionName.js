import { useEffect, useState } from 'react';
import { api } from '../api/client';

// The display name of a region ("Tagalog") from the public GET /api/regions/{code}.
//   const name = useRegionName('tagalog');
// It is only a nicer label: until the answer arrives, or if the request fails,
// it returns the code itself. It never blocks or breaks a game.
export default function useRegionName(code) {
  const [found, setFound] = useState({ code: null, name: null });

  useEffect(() => {
    let cancelled = false;                          // ignore a late answer for an old code
    api(`/api/regions/${encodeURIComponent(code)}`)
      .then((r) => { if (!cancelled && r?.name) setFound({ code, name: r.name }); })
      .catch(() => { /* keep showing the code */ });
    return () => { cancelled = true; };
  }, [code]);

  return found.code === code ? found.name : code;
}
