import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  api, getMembership, setMembership, getName, setName, getToken, setLastRead,
} from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { Avatar } from '../components/ui.jsx';
import { GroupAvatar, Linkify, barColor, clock, dayLabel, nameColor } from '../components/chatUi.jsx';

const POLL_MS = 2000;
const SWIPE_TRIGGER = 60;
const isFinePointer = () => window.matchMedia?.('(pointer: fine)').matches;
const senderKey = (m) => (m.member_id != null ? `m${m.member_id}` : `n${m.name}`);

// Keep the chat sized to the visible area when the mobile keyboard opens
function useViewportHeight() {
  const [h, setH] = useState(() => window.visualViewport?.height || window.innerHeight);
  useEffect(() => {
    const vv = window.visualViewport;
    const on = () => {
      setH(vv ? vv.height : window.innerHeight);
      window.scrollTo(0, 0);
    };
    (vv || window).addEventListener('resize', on);
    return () => (vv || window).removeEventListener('resize', on);
  }, []);
  return h;
}

// ---------- One message (swipe left to reply, long-press / right-click for menu) ----------
function Message({ m, mine, first, last, highlight, onReply, onMenu, onJump }) {
  const [dx, setDx] = useState(0);
  const touch = useRef(null);
  const press = useRef(null);

  const cancelPress = () => { clearTimeout(press.current); press.current = null; };

  function onTouchStart(e) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, axis: null };
    press.current = setTimeout(() => {
      press.current = null;
      touch.current = null;
      navigator.vibrate?.(12);
      onMenu(m);
    }, 480);
  }
  function onTouchMove(e) {
    const s = touch.current;
    if (!s) return;
    const t = e.touches[0];
    const mx = t.clientX - s.x;
    const my = t.clientY - s.y;
    if (Math.abs(mx) > 8 || Math.abs(my) > 8) cancelPress();
    if (!s.axis && (Math.abs(mx) > 8 || Math.abs(my) > 8)) s.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (s.axis === 'x' && mx < 0) {
      const pulled = Math.min(96, -mx * 0.75);
      if (pulled >= SWIPE_TRIGGER && dx > -SWIPE_TRIGGER) navigator.vibrate?.(8);
      setDx(-pulled);
    }
  }
  function onTouchEnd() {
    cancelPress();
    if (dx <= -SWIPE_TRIGGER) onReply(m);
    setDx(0);
    touch.current = null;
  }

  const bubble = mine
    ? `bg-[#e1fec6] ${last ? 'rounded-br-md' : ''}`
    : `bg-white ${last ? 'rounded-bl-md' : ''}`;

  return (
    <div
      id={`msg-${m.id}`}
      className={`group relative flex items-end gap-1.5 px-2 ${first ? 'mt-2' : 'mt-0.5'} ${highlight ? 'msg-flash' : ''} ${mine ? 'justify-end' : ''}`}
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); onMenu(m); }}
      onDoubleClick={() => isFinePointer() && onReply(m)}
    >
      {/* Reply arrow revealed by the swipe */}
      <span
        className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white"
        style={{ opacity: Math.min(1, -dx / SWIPE_TRIGGER), transform: `translateY(-50%) scale(${0.6 + Math.min(1, -dx / SWIPE_TRIGGER) * 0.4})` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
      </span>

      {!mine && (
        <span className="w-8 shrink-0">{last && <Avatar name={m.name} size="h-8 w-8" />}</span>
      )}

      <div
        className={`flex max-w-[82%] items-center gap-1 sm:max-w-[70%] ${mine ? 'flex-row-reverse' : ''}`}
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? 'transform .2s ease-out' : 'none' }}
      >
        <div className={`min-w-0 rounded-2xl px-3 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,.08)] ${bubble}`}>
          {!mine && first && <p className={`text-[13px] font-semibold ${nameColor(m.name)}`}>{m.name}</p>}

          {m.reply && (
            <button
              type="button"
              onClick={() => !m.reply.deleted && onJump(m.reply.id)}
              className={`my-1 block w-full rounded-md border-l-[3px] px-2 py-1 text-left ${mine ? 'border-emerald-600 bg-emerald-700/10' : `${barColor(m.reply.name)} bg-gray-500/10`}`}
            >
              <span className={`block truncate text-xs font-semibold ${mine ? 'text-emerald-700' : 'text-gray-700'}`}>
                {m.reply.deleted ? 'Deleted message' : m.reply.name}
              </span>
              {!m.reply.deleted && <span className="line-clamp-1 break-all text-xs text-gray-600">{m.reply.body}</span>}
            </button>
          )}

          <div className="relative text-[15px] leading-snug text-gray-900">
            <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"><Linkify text={m.body} /></span>
            <span className="invisible ml-2 inline-block text-[11px]" aria-hidden="true">{clock(m.ts)}{mine ? ' ✓✓' : ''}</span>
            <span className={`absolute bottom-[-2px] right-0 text-[11px] ${mine ? 'text-emerald-700/70' : 'text-gray-400'}`}>
              {clock(m.ts)}{mine && <span className="ml-0.5 text-emerald-600">✓✓</span>}
            </span>
          </div>
        </div>

        {/* Desktop: hover reply */}
        <button
          type="button"
          onClick={() => onReply(m)}
          aria-label="Reply"
          className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-gray-500 opacity-0 shadow-sm transition group-hover:opacity-100 sm:flex"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
        </button>
      </div>
    </div>
  );
}

// ---------- Bottom sheet ----------
function Sheet({ onClose, children, label }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[55] flex animate-fade-in items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={label} className="max-h-[80vh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
        {children}
      </div>
    </div>
  );
}

function MembersSheet({ group, mine, onClose, onLeave }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`chat.php?action=members&group=${group.slug}`).then(setList).catch((e) => setErr(e.message));
  }, [group.slug]);

  return (
    <Sheet onClose={onClose} label="Group info">
      <div className="mb-4 flex flex-col items-center text-center">
        <GroupAvatar group={group} size="h-20 w-20" />
        <h3 className="mt-2 text-xl font-extrabold">{group.name}</h3>
        <p className="text-sm text-gray-500">{group.description}</p>
        <p className="mt-1 text-sm text-gray-500">
          {group.members.toLocaleString()} {group.members === 1 ? 'member' : 'members'}
          {group.online > 0 && <span className="text-emerald-600">, {group.online} online</span>}
        </p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!list && !err && <p className="py-4 text-center text-sm text-gray-400">Loading members…</p>}
      {list && (
        <ul className="divide-y divide-gray-100">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span className="relative">
                <Avatar name={p.name} size="h-9 w-9" />
                {p.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {p.name} {mine?.id === p.id && <span className="text-xs text-gray-400">(you)</span>}
              </span>
              <span className={`text-xs ${p.online ? 'text-emerald-600' : 'text-gray-400'}`}>{p.online ? 'online' : ''}</span>
            </li>
          ))}
        </ul>
      )}
      {mine && (
        <button onClick={onLeave} className="mt-4 w-full rounded-2xl bg-red-50 py-3 text-sm font-semibold text-red-600 active:scale-[0.98]">
          Leave group
        </button>
      )}
    </Sheet>
  );
}

// ---------- Room ----------
// Rendered outside <Routes> (full screen), so App passes the slug in
export default function ChatRoom({ slug }) {
  const navigate = useNavigate();
  const toast = useToast();
  const height = useViewportHeight();

  const [me, setMe] = useState(() => getMembership(slug));
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error | missing
  const [errMsg, setErrMsg] = useState('');
  const [reply, setReply] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [joinName, setJoinName] = useState(getName());
  const [joining, setJoining] = useState(false);
  const [menu, setMenu] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const [flash, setFlash] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scroller = useRef(null);
  const input = useRef(null);
  const lastId = useRef(0);
  const since = useRef(0);
  const atBottom = useRef(true);
  const stick = useRef(true);
  const prepend = useRef(null);
  const meRef = useRef(me);
  meRef.current = me;

  const isAdmin = Boolean(getToken());

  const merge = useCallback((incoming, deleted = []) => {
    const fresh = incoming.filter((x) => x.id > lastId.current);
    if (lastId.current && !atBottom.current) {
      const others = fresh.filter((x) => x.member_id !== meRef.current?.id).length;
      if (others) setUnseen((u) => u + others);
    }
    setMessages((prev) => {
      let next = prev;
      if (deleted.length) {
        const gone = new Set(deleted);
        next = next.filter((x) => !gone.has(x.id));
      }
      const have = new Set(next.map((x) => x.id));
      const add = incoming.filter((x) => !have.has(x.id));
      if (!add.length) return next;
      return [...next, ...add].sort((a, b) => a.id - b.id);
    });
    for (const x of incoming) if (x.id > lastId.current) lastId.current = x.id;
  }, []);

  // ----- Initial load + live polling -----
  useEffect(() => {
    let alive = true;
    let timer;
    lastId.current = 0;
    since.current = 0;
    setMessages([]);
    setStatus('loading');
    stick.current = true;

    async function poll() {
      clearTimeout(timer);
      if (!alive) return;
      if (document.hidden && lastId.current) { timer = setTimeout(poll, POLL_MS); return; }
      const q = new URLSearchParams({ action: 'messages', group: slug });
      const token = meRef.current?.token;
      if (token) q.set('token', token);
      if (lastId.current) q.set('after', String(lastId.current));
      if (since.current) q.set('since', String(since.current));
      try {
        const d = await api(`chat.php?${q}`);
        if (!alive) return;
        setGroup(d.group);
        if (token && !d.me) { setMembership(slug, null); setMe(null); }
        if (!lastId.current) setHasMore(d.has_more);
        if (lastId.current) stick.current = atBottom.current; // first load always sticks
        merge(d.messages, d.deleted);
        since.current = d.now;
        setStatus('ready');
      } catch (e) {
        if (!alive) return;
        if (e.status === 404) { setStatus('missing'); return; }
        if (!lastId.current) { setErrMsg(e.message); setStatus((s) => (s === 'ready' ? s : 'error')); }
      }
      timer = setTimeout(poll, POLL_MS);
    }

    poll();
    const wake = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, merge]);

  // ----- Scroll management -----
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prepend.current != null) {
      el.scrollTop += el.scrollHeight - prepend.current;
      prepend.current = null;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
      stick.current = false;
      atBottom.current = true;
    }
    if (atBottom.current && lastId.current && meRef.current) setLastRead(slug, lastId.current);
  }, [messages, slug]);

  // Keep pinned to bottom when the keyboard resizes the viewport
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [height, reply]);

  async function loadOlder() {
    if (loadingOlder || !hasMore || !messages.length) return;
    setLoadingOlder(true);
    try {
      const d = await api(`chat.php?action=messages&group=${slug}&before=${messages[0].id}`);
      prepend.current = scroller.current?.scrollHeight ?? null;
      setMessages((prev) => {
        const have = new Set(prev.map((x) => x.id));
        return [...d.messages.filter((x) => !have.has(x.id)), ...prev];
      });
      setHasMore(d.has_more);
    } catch (e) {
      toast(e.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  function onScroll() {
    const el = scroller.current;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottom.current = bottom;
    if (bottom) {
      if (unseen) setUnseen(0);
      if (lastId.current && me) setLastRead(slug, lastId.current);
    }
    if (el.scrollTop < 120) loadOlder();
  }

  function toBottom() {
    const el = scroller.current;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setUnseen(0);
  }

  function jumpTo(id) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) { toast('That message is further up. Scroll to load older messages.'); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(null);
    requestAnimationFrame(() => setFlash(id));
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1700);
  }

  const startReply = useCallback((m) => {
    if (!meRef.current) { toast('Join the group to reply'); return; }
    setReply(m);
    setTimeout(() => input.current?.focus(), 0);
  }, [toast]);

  // ----- Actions -----
  async function join(e) {
    e.preventDefault();
    const name = joinName.trim();
    if (!name) return;
    setJoining(true);
    try {
      const d = await api('chat.php', { method: 'POST', json: { action: 'join', group: slug, name } });
      const m = { token: d.token, id: d.member.id, name: d.member.name };
      setMembership(slug, m);
      setName(name);
      setMe(m);
      setGroup((g) => (g ? { ...g, members: d.members, online: d.online } : g));
      if (lastId.current) setLastRead(slug, lastId.current);
      toast(`🎉 Welcome to ${group?.name || 'the group'}!`);
    } catch (e2) {
      toast(e2.message);
    } finally {
      setJoining(false);
    }
  }

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending || !me) return;
    setSending(true);
    try {
      const m = await api('chat.php', {
        method: 'POST',
        json: { action: 'send', token: me.token, body, reply_to: reply?.id || null },
      });
      setText('');
      setReply(null);
      stick.current = true;
      merge([m]);
      input.current?.focus();
    } catch (e2) {
      if (e2.status === 403) { setMembership(slug, null); setMe(null); }
      toast(e2.message);
    } finally {
      setSending(false);
    }
  }

  async function leave() {
    if (!window.confirm(`Leave ${group.name}?`)) return;
    try {
      await api('chat.php', { method: 'POST', json: { action: 'leave', token: me.token } });
    } catch { /* leave locally anyway */ }
    setMembership(slug, null);
    setMe(null);
    setShowInfo(false);
    setGroup((g) => ({ ...g, members: Math.max(0, g.members - 1) }));
  }

  async function del(m) {
    setMenu(null);
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await api('chat.php', { method: 'POST', json: { action: 'delete', id: m.id } });
      setMessages((list) => list.filter((x) => x.id !== m.id));
    } catch (e) {
      toast(e.status === 401 ? 'Admin sign-in required' : e.message);
    }
  }

  async function copy(m) {
    setMenu(null);
    try { await navigator.clipboard.writeText(m.body); toast('Copied'); } catch { /* ignore */ }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && isFinePointer()) { e.preventDefault(); send(); }
    if (e.key === 'Escape' && reply) setReply(null);
  }

  // Auto-grow textarea
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  // ----- Render -----
  if (status === 'missing') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">🤔</p>
        <p className="font-semibold">This group doesn't exist.</p>
        <Link to="/chat" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">Back to chats</Link>
      </div>
    );
  }

  const rows = [];
  let prev = null;
  messages.forEach((m, i) => {
    const next = messages[i + 1];
    const newDay = !prev || dayLabel(prev.ts) !== dayLabel(m.ts);
    if (newDay) rows.push(<div key={`d${m.id}`} className="sticky top-2 z-10 my-3 flex justify-center"><span className="rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur">{dayLabel(m.ts)}</span></div>);
    const same = (a, b) => a && b && senderKey(a) === senderKey(b) && Math.abs(a.ts - b.ts) < 300 && dayLabel(a.ts) === dayLabel(b.ts);
    rows.push(
      <Message
        key={m.id}
        m={m}
        mine={me != null && m.member_id === me.id}
        first={newDay || !same(prev, m)}
        last={!same(m, next)}
        highlight={flash === m.id}
        onReply={startReply}
        onMenu={setMenu}
        onJump={jumpTo}
      />
    );
    prev = m;
  });

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex flex-col overflow-hidden bg-white" style={{ height }}>
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white/95 px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur">
        <button onClick={() => navigate('/chat')} aria-label="Back to chats" className="flex h-10 w-10 items-center justify-center rounded-full text-emerald-600 active:bg-gray-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button onClick={() => group && setShowInfo(true)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          {group ? <GroupAvatar group={group} size="h-10 w-10" /> : <span className="h-10 w-10 rounded-full bg-gray-200" />}
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold">{group?.name || 'Loading…'}</span>
            {group && (
              <span className="block truncate text-xs text-gray-500">
                {group.members.toLocaleString()} {group.members === 1 ? 'member' : 'members'}
                {group.online > 0 && <span className="text-emerald-600">, {group.online} online</span>}
              </span>
            )}
          </span>
        </button>
      </header>

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} className="chat-bg relative flex-1 overflow-y-auto overscroll-contain pb-2">
        {status === 'loading' && (
          <div className="flex h-full items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        )}
        {status === 'error' && (
          <div className="m-6 rounded-2xl bg-white p-4 text-center text-sm text-red-600 shadow">{errMsg}</div>
        )}
        {status === 'ready' && (
          <>
            {hasMore && (
              <div className="flex justify-center py-2">
                <button onClick={loadOlder} className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white">
                  {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}
            {!messages.length && (
              <div className="mx-auto mt-16 max-w-xs rounded-2xl bg-black/20 p-4 text-center text-sm text-white backdrop-blur">
                <p className="text-2xl">👋</p>
                No messages here yet.<br />Be the first to say hello!
              </div>
            )}
            {rows}
          </>
        )}
      </div>

      {unseen > 0 && (
        <button onClick={toBottom} className="absolute bottom-24 right-4 z-20 flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-lg ring-1 ring-black/5 active:scale-95">
          ↓ {unseen} new
        </button>
      )}

      {/* Composer / Join */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {me ? (
          <>
            {reply && (
              <div className="mb-2 flex items-center gap-2 px-1">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
                <button type="button" onClick={() => jumpTo(reply.id)} className="min-w-0 flex-1 border-l-[3px] border-emerald-500 pl-2 text-left">
                  <span className="block truncate text-xs font-semibold text-emerald-700">Reply to {reply.name}</span>
                  <span className="block truncate text-xs text-gray-500">{reply.body}</span>
                </button>
                <button type="button" onClick={() => setReply(null)} aria-label="Cancel reply" className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 active:bg-gray-100">×</button>
              </div>
            )}
            <form onSubmit={send} className="flex items-end gap-2">
              <textarea
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={2000}
                placeholder="Message"
                aria-label="Message"
                className="max-h-36 min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-gray-100 px-4 py-2.5 text-[15px] leading-snug outline-none ring-emerald-500 focus:bg-white focus:ring-2"
              />
              <button
                disabled={!text.trim() || sending}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow transition active:scale-90 disabled:bg-gray-300"
              >
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12l-11.61 1.87z" /></svg>
              </button>
            </form>
          </>
        ) : status === 'ready' ? (
          <form onSubmit={join} className="space-y-2 p-1">
            <p className="text-center text-sm text-gray-600">
              Join <span className="font-semibold">{group?.name}</span> to chat. Just your name, no phone number.
            </p>
            <div className="flex gap-2">
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                required
                aria-label="Your name"
                className="min-w-0 flex-1 rounded-full border-0 bg-gray-100 px-4 py-2.5 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-2"
              />
              <button disabled={joining || !joinName.trim()} className="shrink-0 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow active:scale-95 disabled:opacity-60">
                {joining ? 'Joining…' : 'Join'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {menu && (
        <Sheet onClose={() => setMenu(null)} label="Message options">
          <div className="mb-3 rounded-2xl bg-gray-50 p-3 text-sm">
            <p className={`font-semibold ${nameColor(menu.name)}`}>{menu.name}</p>
            <p className="line-clamp-3 whitespace-pre-wrap break-words text-gray-700">{menu.body}</p>
          </div>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl ring-1 ring-gray-100">
            <button onClick={() => { const m = menu; setMenu(null); startReply(m); }} className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium active:bg-gray-50">↩️ Reply</button>
            <button onClick={() => copy(menu)} className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium active:bg-gray-50">📋 Copy text</button>
            {isAdmin && (
              <button onClick={() => del(menu)} className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium text-red-600 active:bg-red-50">🗑️ Delete for everyone</button>
            )}
          </div>
        </Sheet>
      )}

      {showInfo && group && (
        <MembersSheet group={group} mine={me} onClose={() => setShowInfo(false)} onLeave={leave} />
      )}
    </div>
  );
}
