import { useEffect, useState } from 'react';
import AdminGate from '../components/AdminGate.jsx';
import { Loading, ErrorMsg, Empty } from '../components/Status.jsx';
import { Avatar, timeAgo } from '../components/ui.jsx';
import useFetch from '../api/useFetch.js';
import { api } from '../api/client.js';

const inputCls =
  'w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm outline-none ring-emerald-500 placeholder:text-gray-400 focus:bg-white focus:ring-2';
const btnCls =
  'rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition active:scale-95 disabled:opacity-60';
const cardCls = 'rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100';

// ---------- Pending questions ----------
function PendingItem({ q, onDone, onAuthFail }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('answers.php', {
        method: 'POST',
        json: { question_id: q.id, answer_text: text.trim() },
      });
      onDone(q.id); // unmounts this item
    } catch (e2) {
      if (e2.status === 401) return onAuthFail();
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <li className={`${cardCls} animate-rise space-y-3`}>
      <div className="flex gap-3">
        <Avatar name={q.user_name} size="h-9 w-9" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-gray-700">{q.user_name}</span> · {timeAgo(q.created_at)}
          </p>
          <p className="break-words font-semibold leading-snug">{q.question_text}</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
          placeholder="Write your answer…"
          className={`${inputCls} resize-none`}
        />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy || !text.trim()} className={btnCls}>
          {busy ? 'Posting…' : 'Post Answer'}
        </button>
      </form>
    </li>
  );
}

function PendingQuestions({ onAuthFail }) {
  const { data, loading, error, reload, setData } = useFetch('questions.php');
  useEffect(() => { if (error?.status === 401) onAuthFail(); }, [error, onAuthFail]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMsg error={error} onRetry={reload} />;
  if (!data.length) return <Empty icon="🎉">No pending questions</Empty>;

  return (
    <ul className="space-y-4">
      {data.map((q) => (
        <PendingItem
          key={q.id}
          q={q}
          onAuthFail={onAuthFail}
          onDone={(id) => setData((list) => list.filter((x) => x.id !== id))}
        />
      ))}
    </ul>
  );
}

// ---------- Manage comments ----------
function ManageComments({ onAuthFail }) {
  const { data, loading, error, reload, setData } = useFetch('comments.php?status=pending');
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (error?.status === 401) onAuthFail(); }, [error, onAuthFail]);

  async function approve(id) {
    setBusyId(id);
    setErr('');
    try {
      await api(`comments.php?id=${id}`, { method: 'PATCH' });
      setData((list) => list.filter((c) => c.id !== id));
    } catch (e) {
      if (e.status === 401) return onAuthFail();
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMsg error={error} onRetry={reload} />;
  if (!data.length) return <Empty icon="🧹">No comments awaiting approval.</Empty>;

  return (
    <div className="space-y-3">
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <ul className="space-y-3">
        {data.map((c) => (
          <li key={c.id} className={`${cardCls} animate-rise space-y-2`}>
            <p className="truncate text-xs text-gray-400">On: {c.question_text}</p>
            <div className="flex gap-2.5">
              <Avatar name={c.user_name} size="h-8 w-8" />
              <div className="min-w-0 rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-2 text-sm">
                <p className="font-bold">{c.user_name}</p>
                <p className="break-words text-gray-700">{c.comment_text}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
              <button onClick={() => approve(c.id)} disabled={busyId === c.id} className={btnCls}>
                {busyId === c.id ? '…' : '✓ Approve'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Create post ----------
function CreatePost({ onAuthFail }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData();
    form.append('title', title.trim());
    form.append('content', content.trim());
    if (image) form.append('image', image);
    try {
      await api('posts.php', { method: 'POST', form });
      setTitle('');
      setContent('');
      setImage(null);
      setFileKey((k) => k + 1); // resets the file input
      setMsg({ ok: true, text: 'Post published.' });
    } catch (e2) {
      if (e2.status === 401) return onAuthFail();
      setMsg({ ok: false, text: e2.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${cardCls} space-y-3`}>
      <label className="relative flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-center transition hover:bg-emerald-50">
        {preview ? (
          <img src={preview} alt="Selected" className="max-h-72 w-full object-cover" />
        ) : (
          <span className="p-6 text-sm font-medium text-emerald-700">
            <span className="mb-1 block text-3xl">📷</span>
            Tap to add a photo
          </span>
        )}
        <input
          key={fileKey}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setImage(e.target.files[0] || null)}
          className="sr-only"
        />
      </label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={255} required className={inputCls} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a caption…" rows={5} required className={`${inputCls} resize-none`} />
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}
      <button disabled={busy} className={`${btnCls} w-full py-3`}>{busy ? 'Publishing…' : 'Publish'}</button>
    </form>
  );
}

// ---------- Panel ----------
const TABS = [
  ['pending', 'Questions'],
  ['comments', 'Comments'],
  ['post', 'New Post'],
];

function Panel({ onLogout }) {
  const [tab, setTab] = useState('pending');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name="A" brand ring size="h-11 w-11" />
          <div className="leading-tight">
            <h2 className="text-lg font-extrabold">Admin Studio</h2>
            <p className="text-xs text-gray-400">Manage questions, comments and posts</p>
          </div>
        </div>
        <button onClick={onLogout} className="rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-600 active:scale-95">
          Sign out
        </button>
      </div>

      <div role="tablist" className="flex gap-1 rounded-full bg-gray-200/70 p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-emerald-700 shadow' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pending' && <PendingQuestions onAuthFail={onLogout} />}
      {tab === 'comments' && <ManageComments onAuthFail={onLogout} />}
      {tab === 'post' && <CreatePost onAuthFail={onLogout} />}
    </div>
  );
}

export default function Admin() {
  return <AdminGate>{(logout) => <Panel onLogout={logout} />}</AdminGate>;
}