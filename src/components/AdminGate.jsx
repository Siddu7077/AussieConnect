import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client.js';
import { Loading } from './Status.jsx';

const card = 'mx-auto mt-8 max-w-sm rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100';
const Lock = () => (
  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-lg shadow-emerald-500/30">
    🔐
  </div>
);

// Usage: <AdminGate>{(logout) => <Panel onLogout={logout} />}</AdminGate>
export default function AdminGate({ children }) {
  const [status, setStatus] = useState(getToken() ? 'checking' : 'locked'); // checking | locked | error | ok
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // Admin-only endpoint doubles as a token check: 401 = wrong token
  const verify = useCallback(async () => {
    try {
      await api('questions.php');
      setError('');
      setStatus('ok');
    } catch (e) {
      if (e.status === 401) {
        clearToken();
        setError('That token was not accepted.');
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
    setInput('');
    setError('');
    setStatus('locked');
  }, []);

  if (status === 'ok') return children(logout);
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

  function submit(e) {
    e.preventDefault();
    setToken(input.trim());
    setStatus('checking');
    verify();
  }

  return (
    <form onSubmit={submit} className={`${card} space-y-3`}>
      <Lock />
      <h2 className="text-xl font-extrabold">Admin access</h2>
      <p className="text-xs text-gray-400">Enter your admin token to continue.</p>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Admin token"
        autoComplete="current-password"
        required
        className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-center text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-2"
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-[0.98]">
        Unlock
      </button>
    </form>
  );
}