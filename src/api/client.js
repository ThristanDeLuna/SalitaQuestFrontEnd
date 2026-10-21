const BASE = import.meta.env.VITE_API_BASE_URL;
const KEY = 'sq_tokens';

// Storage can be blocked or empty (private window), so every access is wrapped.
export const tokens = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

let onSlow = () => {};
export const setSlowHandler = (fn) => { onSlow = fn; };   // the layout shows the banner

async function send(path, options = {}) {
  const t = tokens.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (t?.access_token) headers.Authorization = `Bearer ${t.access_token}`;
  const timer = setTimeout(() => onSlow(true), 4000);   // a sleeping free server is slow
  try {
    return await fetch(BASE + path, { ...options, headers });
  } finally {
    clearTimeout(timer);
    onSlow(false);
  }
}

export async function api(path, options = {}) {
  let res = await send(path, options);

  // Expired access token: try the refresh token once, then repeat the call.
  if (res.status === 401 && tokens.get()?.refresh_token) {
    const r = await send('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokens.get().refresh_token }),
    });
    if (r.ok) {
      tokens.set((await r.json()).tokens);
      res = await send(path, options);
    } else {
      tokens.clear();
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.error || 'Request failed'), { status: res.status });
  return data;
}
