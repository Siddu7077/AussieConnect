import { useState } from 'react';
import { api, getName, setName } from '../api/client.js';
import { Avatar, timeAgo } from './ui.jsx';

const field =
  'w-full rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm outline-none ring-emerald-500 placeholder:text-gray-400 focus:bg-white focus:ring-2';

function CommentForm({ target, targetId, onAdded }) {
  const [name, setNameState] = useState(getName());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const c = await api('comments.php', {
        method: 'POST',
        json: { [`${target}_id`]: targetId, user_name: name.trim(), comment_text: text.trim() },
      });
      setName(name.trim());
      setText('');
      onAdded(c);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input
        value={name}
        onChange={(e) => setNameState(e.target.value)}
        placeholder="Your name"
        maxLength={100}
        required
        className={field}
      />
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={1000}
          required
          className={`min-w-0 flex-1 ${field}`}
        />
        <button
          disabled={busy}
          aria-label="Send comment"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 transition active:scale-90 disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>
      {err && <p role="alert" className="px-1 text-xs text-red-600">{err}</p>}
    </form>
  );
}

// target: 'post' | 'answer'
export default function Comments({ target, targetId, initial = [] }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(initial);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-700"
      >
        <span>💬 Comments ({list.length})</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 animate-fade-in">
          {list.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet. Start the conversation!</p>
          ) : (
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar name={c.user_name} size="h-8 w-8" />
                  <div className="min-w-0 rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-2 text-sm">
                    <p className="font-bold">
                      {c.user_name} <span className="ml-1 text-xs font-normal text-gray-400">{timeAgo(c.created_at)}</span>
                    </p>
                    <p className="whitespace-pre-line break-words text-gray-700">{c.comment_text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <CommentForm target={target} targetId={targetId} onAdded={(c) => setList((l) => [...l, c])} />
        </div>
      )}
    </div>
  );
}
