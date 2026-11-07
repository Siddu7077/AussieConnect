import { useState } from 'react';
import ReactionBar from './ReactionBar.jsx';
import { api, getName, setName } from '../api/client.js';
import { Avatar, Verified, timeAgo } from './ui.jsx';

const field =
  'w-full rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm outline-none ring-emerald-500 placeholder:text-gray-400 focus:bg-white focus:ring-2';

function CommentForm({ answerId }) {
  const [name, setNameState] = useState(getName());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('comments.php', {
        method: 'POST',
        json: { answer_id: answerId, user_name: name.trim(), comment_text: text.trim() },
      });
      setName(name.trim());
      setText('');
      setMsg({ ok: true, text: 'Thanks! Your comment will appear once approved.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
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
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`px-1 text-xs ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

export default function QuestionCard({ item }) {
  const { answer } = item;
  const [open, setOpen] = useState(false);

  return (
    <article className="animate-rise space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex gap-3">
        <Avatar name={item.user_name} size="h-10 w-10" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-gray-700">{item.user_name}</span> asked · {timeAgo(item.created_at)}
          </p>
          <h2 className="mt-0.5 break-words text-[15px] font-bold leading-snug">{item.question_text}</h2>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
        <div className="mb-2 flex items-center gap-2">
          <Avatar name="A" brand ring size="h-8 w-8" />
          <span className="flex items-center gap-1 text-sm font-bold text-emerald-900">
            Aussie Connect <Verified className="h-3.5 w-3.5" />
          </span>
          <span className="ml-auto text-xs text-emerald-700/70">{timeAgo(answer.created_at)}</span>
        </div>
        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-emerald-950">{answer.answer_text}</p>
      </div>

      <ReactionBar targetType="answer" targetId={answer.id} initialCounts={answer.reactions} />

      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-700"
        >
          <span>💬 Comments ({answer.comments.length})</span>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="mt-3 animate-fade-in">
            {answer.comments.length === 0 ? (
              <p className="text-sm text-gray-400">No comments yet. Start the conversation!</p>
            ) : (
              <ul className="space-y-3">
                {answer.comments.map((c) => (
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
            <CommentForm answerId={answer.id} />
          </div>
        )}
      </div>
    </article>
  );
}