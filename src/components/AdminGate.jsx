import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client.js';
import { Loading } from './Status.jsx';

const card = 'mx-auto mt-8 max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100';
const inputCls =
  'w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-2';
const Lock = () => (
  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-lg shadow-emerald-500/30">
    🔐
  </div>
);

// Usage: <AdminGate>{(logout, admin) => <Panel onLogout={logout} me={admin} />}</AdminGate>
export default function AdminGate({ children }) {
  const [status, setStatus] = useState(getToken() ? 'checking' : 'locked'); // checking | locked | error | ok
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Validate a saved token
  const verify = useCallback(async () => {
    try {
      setAdmin(await api('login.php'));
      setError('');
      setStatus('ok');
    } catch (e) {
      if (e.status === 401) {
        clearToken();
        setError('Your session has expired. Please sign in again.');
        setStatus('locked');
      } else {
        setError(e.message);
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => { if (getToken()) verify(); }, [verify]);

  const logout = useCallback(() => {
    clearToken();
    setAdmin(null);
    setPassword('');
    setError('');
    setStatus('locked');
  }, []);

  if (status === 'ok') return children(logout, admin);
  if (status === 'checking') return <Loading label="Checking access…" />;

  if (status === 'error') {
    return (
      <div role="alert" className={`${card} space-y-3`}>
        <p className="text-sm text-red-600">{error}</p>
        <div className="flex gap-2">
          <button onClick={() => { setStatus('checking'); verify(); }} className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white active:scale-95">
            Retry
          </button>
          <button onClick={logout} className="flex-1 rounded-2xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 active:scale-95">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    clearToken();
    try {
      const res = await api('login.php', { method: 'POST', json: { email: email.trim(), password } });
      setToken(res.token);
      setAdmin(res.admin);
      setPassword('');
      setStatus('ok');
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${card} space-y-3`}>
      <Lock />
      <h2 className="text-xl font-extrabold">Admin sign in</h2>
      <p className="text-xs text-gray-400">Use your admin email and password.</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="username"
        required
        className={inputCls}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        required
        className={inputCls}
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-60">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
