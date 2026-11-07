const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const store = {
  get: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* private mode */ } },
};

export const getToken = () => store.get('ac_admin_token');
export const setToken = (t) => store.set('ac_admin_token', t);
export const clearToken = () => store.del('ac_admin_token');

export const getName = () => store.get('ac_name');
export const setName = (n) => store.set('ac_name', n);

// Anonymous per-device ID, sent as user_name for reactions
export function getUserId() {
  let id = store.get('ac_uid');
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    store.set('ac_uid', id);
  }
  return id;
}

export function fmtDate(s) {
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? '' : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// api('posts.php')  |  api('x.php', { method, json })  |  api('x.php', { method: 'POST', form })
export async function api(path, { method = 'GET', json, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['X-Admin-Token'] = token;

  let body;
  if (form) body = form; // browser sets the multipart boundary
  else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(`${BASE}/${path}`, { method, headers, body });
  } catch {
    throw Object.assign(new Error('Network error. Check your connection.'), { status: 0 });
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }
  if (!res.ok) {
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}
