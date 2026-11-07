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
const ghostBtn =
  'rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition active:scale-95 disabled:opacity-60';

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

// ---------- Manage comments (auto-approved; admin can hide / unhide) ----------
function ManageComments({ onAuthFail }) {
  const { data, loading, error, reload, setData } = useFetch('comments.php?status=all');
  const [filter, setFilter] = useState('all'); // all | visible | hidden
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (error?.status === 401) onAuthFail(); }, [error, onAuthFail]);

  async function toggle(c) {
    setBusyId(c.id);
    setErr('');
    try {
      await api('comments.php', { method: 'PATCH', json: { id: c.id, hidden: !c.hidden } });
      setData((list) => list.map((x) => (x.id === c.id ? { ...x, hidden: !c.hidden } : x)));
    } catch (e) {
      if (e.status === 401) return onAuthFail();
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMsg error={error} onRetry={reload} />;
  if (!data.length) return <Empty icon="💬">No comments yet.</Empty>;

  const shown = data.filter((c) => filter === 'all' || (filter === 'hidden') === c.hidden);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['all', 'visible', 'hidden'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {!shown.length && <Empty icon="🧹">Nothing here.</Empty>}
      <ul className="space-y-3">
        {shown.map((c) => (
          <li key={c.id} className={`${cardCls} space-y-2 ${c.hidden ? 'opacity-60' : ''}`}>
            <p className="truncate text-xs text-gray-400">
              {c.target_type === 'post' ? '📷 Post' : '❓ Q&A'}: {c.context}
            </p>
            <div className="flex gap-2.5">
              <Avatar name={c.user_name} size="h-8 w-8" />
              <div className="min-w-0 rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-2 text-sm">
                <p className="font-bold">{c.user_name}</p>
                <p className="whitespace-pre-line break-words text-gray-700">{c.comment_text}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                {timeAgo(c.created_at)}
                {c.hidden && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">Hidden</span>}
              </span>
              <button
                onClick={() => toggle(c)}
                disabled={busyId === c.id}
                className={c.hidden ? btnCls : `${ghostBtn} text-red-600`}
              >
                {busyId === c.id ? '…' : c.hidden ? 'Unhide' : 'Hide'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Post form (create + edit) ----------
function PostForm({ post, onSaved, onCancel, onAuthFail }) {
  const editing = Boolean(post);
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
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

  const shownImage = preview || (!removeImage && post?.image_url) || '';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData();
    form.append('action', editing ? 'update' : 'create');
    if (editing) form.append('id', post.id);
    form.append('title', title.trim());
    form.append('content', content.trim());
    if (image) form.append('image', image);
    else if (removeImage) form.append('remove_image', '1');
    try {
      const saved = await api('posts.php', { method: 'POST', form });
      if (!editing) {
        setTitle('');
        setContent('');
        setImage(null);
        setFileKey((k) => k + 1);
        setMsg({ ok: true, text: 'Post published.' });
      }
      onSaved(saved);
    } catch (e2) {
      if (e2.status === 401) return onAuthFail();
      setMsg({ ok: false, text: e2.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${cardCls} space-y-3`}>
      {editing && <h3 className="font-bold">Edit post</h3>}
      <label className="relative flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-center transition hover:bg-emerald-50">
        {shownImage ? (
          <img src={shownImage} alt="Selected" className="max-h-72 w-full object-cover" />
        ) : (
          <span className="p-6 text-sm font-medium text-emerald-700">
            <span className="mb-1 block text-3xl">📷</span>
            Tap to {editing ? 'choose a new' : 'add a'} photo
          </span>
        )}
        <input
          key={fileKey}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => { setImage(e.target.files[0] || null); setRemoveImage(false); }}
          className="sr-only"
        />
      </label>
      {shownImage && (
        <button
          type="button"
          onClick={() => { setImage(null); setFileKey((k) => k + 1); setRemoveImage(true); }}
          className="text-xs font-semibold text-red-600"
        >
          Remove photo
        </button>
      )}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={255} required className={inputCls} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a caption…" rows={5} required className={`${inputCls} resize-none`} />
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={busy} className={`${btnCls} flex-1 py-3`}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${ghostBtn} py-3`}>Cancel</button>
        )}
      </div>
    </form>
  );
}

// ---------- Manage posts ----------
function ManagePosts({ onAuthFail }) {
  const { data, loading, error, reload, setData } = useFetch('posts.php');
  const [editId, setEditId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  async function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This also removes its comments and reactions.`)) return;
    setBusyId(p.id);
    setErr('');
    const form = new FormData();
    form.append('action', 'delete');
    form.append('id', p.id);
    try {
      await api('posts.php', { method: 'POST', form });
      setData((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      if (e.status === 401) return onAuthFail();
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PostForm onSaved={reload} onAuthFail={onAuthFail} />

      <h3 className="px-1 text-sm font-bold text-gray-500">All posts</h3>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} onRetry={reload} />
      ) : !data.length ? (
        <Empty icon="📭">No posts yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {data.map((p) =>
            editId === p.id ? (
              <li key={p.id}>
                <PostForm
                  post={p}
                  onAuthFail={onAuthFail}
                  onCancel={() => setEditId(null)}
                  onSaved={() => { setEditId(null); reload(); }}
                />
              </li>
            ) : (
              <li key={p.id} className={`${cardCls} flex items-center gap-3`}>
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">📝</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(p.created_at)} · {p.comments?.length || 0} comments
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  <button onClick={() => setEditId(p.id)} className={ghostBtn}>Edit</button>
                  <button onClick={() => remove(p)} disabled={busyId === p.id} className={`${ghostBtn} text-red-600`}>
                    {busyId === p.id ? '…' : 'Delete'}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

// ---------- Manage admins (needs the admin code) ----------
function AdminForm({ admin, code, onSaved, onCancel, onAuthFail }) {
  const editing = Boolean(admin);
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('admins.php', {
        method: 'POST',
        json: {
          action: editing ? 'update' : 'create',
          id: admin?.id,
          code,
          name: name.trim(),
          email: email.trim(),
          password,
        },
      });
      if (!editing) { setName(''); setEmail(''); setPassword(''); }
      onSaved();
    } catch (e2) {
      if (e2.status === 401) return onAuthFail();
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${cardCls} space-y-2.5`}>
      <h3 className="font-bold">{editing ? `Edit ${admin.name}` : 'Add admin'}</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} required className={inputCls} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" maxLength={190} required className={inputCls} />
      <input
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
        maxLength={255}
        required={!editing}
        autoComplete="new-password"
        className={inputCls}
      />
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className={`${btnCls} flex-1`}>
          {busy ? 'Saving…' : editing ? 'Save' : 'Add admin'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className={ghostBtn}>Cancel</button>}
      </div>
    </form>
  );
}

function ManageAdmins({ me, onAuthFail }) {
  const { data, loading, error, reload, setData } = useFetch('admins.php');
  const [code, setCode] = useState('');
  const [editId, setEditId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { if (error?.status === 401) onAuthFail(); }, [error, onAuthFail]);

  async function remove(a) {
    if (!window.confirm(`Delete admin ${a.name} (${a.email})?`)) return;
    setBusyId(a.id);
    setErr('');
    try {
      await api('admins.php', { method: 'POST', json: { action: 'delete', id: a.id, code } });
      setData((list) => list.filter((x) => x.id !== a.id));
    } catch (e) {
      if (e.status === 401) return onAuthFail();
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${cardCls} space-y-2`}>
        <label htmlFor="admin-code" className="block text-sm font-bold">Admin code</label>
        <p className="text-xs text-gray-400">Required to add, edit or delete admins.</p>
        <input
          id="admin-code"
          type="password"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          autoComplete="off"
          className={inputCls}
        />
      </div>

      {code ? (
        <AdminForm code={code} onSaved={reload} onAuthFail={onAuthFail} />
      ) : null}

      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorMsg error={error} onRetry={reload} />
      ) : (
        <ul className="space-y-3">
          {data.map((a) =>
            editId === a.id && code ? (
              <li key={a.id}>
                <AdminForm
                  admin={a}
                  code={code}
                  onAuthFail={onAuthFail}
                  onCancel={() => setEditId(null)}
                  onSaved={() => { setEditId(null); reload(); }}
                />
              </li>
            ) : (
              <li key={a.id} className={`${cardCls} flex items-center gap-3`}>
                <Avatar name={a.name} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {a.name} {a.id === me?.id && <span className="text-xs font-normal text-emerald-600">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-gray-400">{a.email}</p>
                </div>
                {code && (
                  <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                    <button onClick={() => setEditId(a.id)} className={ghostBtn}>Edit</button>
                    {a.id !== me?.id && (
                      <button onClick={() => remove(a)} disabled={busyId === a.id} className={`${ghostBtn} text-red-600`}>
                        {busyId === a.id ? '…' : 'Delete'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

// ---------- Panel ----------
const TABS = [
  ['pending', 'Questions'],
  ['comments', 'Comments'],
  ['posts', 'Posts'],
  ['admins', 'Admins'],
];

function Panel({ onLogout, me }) {
  const [tab, setTab] = useState('pending');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name="A" brand ring size="h-11 w-11" />
          <div className="min-w-0 leading-tight">
            <h2 className="text-lg font-extrabold">Admin Studio</h2>
            <p className="truncate text-xs text-gray-400">Signed in as {me?.name || me?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="shrink-0 rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-600 active:scale-95">
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
            className={`flex-1 whitespace-nowrap rounded-full px-1.5 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
              tab === key ? 'bg-white text-emerald-700 shadow' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pending' && <PendingQuestions onAuthFail={onLogout} />}
      {tab === 'comments' && <ManageComments onAuthFail={onLogout} />}
      {tab === 'posts' && <ManagePosts onAuthFail={onLogout} />}
      {tab === 'admins' && <ManageAdmins me={me} onAuthFail={onLogout} />}
    </div>
  );
}

export default function Admin() {
  return <AdminGate>{(logout, me) => <Panel onLogout={logout} me={me} />}</AdminGate>;
}
