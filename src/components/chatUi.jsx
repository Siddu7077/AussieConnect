// Shared bits for the group chat screens
const CITY = {
  adelaide: { emoji: '🍷', grad: 'from-rose-400 to-red-500' },
  melbourne: { emoji: '☕', grad: 'from-sky-500 to-indigo-600' },
  sydney: { emoji: '🌉', grad: 'from-cyan-400 to-blue-500' },
  darwin: { emoji: '🐊', grad: 'from-amber-400 to-orange-500' },
  canberra: { emoji: '🏛️', grad: 'from-violet-400 to-purple-600' },
  perth: { emoji: '🌅', grad: 'from-orange-400 to-pink-500' },
};

export function GroupAvatar({ group, size = 'h-12 w-12' }) {
  const c = CITY[group.slug] || { emoji: (group.name[0] || '#').toUpperCase(), grad: 'from-emerald-400 to-teal-500' };
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${c.grad} ${size} text-[1.6em] shadow-sm`} aria-hidden="true">
      <span className="text-2xl leading-none">{c.emoji}</span>
    </span>
  );
}

// Telegram-style sender name colours
const NAME_COLORS = ['text-rose-600', 'text-orange-600', 'text-violet-600', 'text-emerald-700', 'text-sky-600', 'text-pink-600', 'text-indigo-600', 'text-teal-700'];
const BAR_COLORS = ['border-rose-500', 'border-orange-500', 'border-violet-500', 'border-emerald-600', 'border-sky-500', 'border-pink-500', 'border-indigo-500', 'border-teal-600'];
function hash(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}
export const nameColor = (key) => NAME_COLORS[hash(key) % NAME_COLORS.length];
export const barColor = (key) => BAR_COLORS[hash(key) % BAR_COLORS.length];

export const clock = (ts) =>
  new Date(ts * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

export function dayLabel(ts) {
  const d = new Date(ts * 1000);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'long',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

// List timestamp: time today, weekday this week, else date
export function chatTime(ts) {
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return clock(ts);
  const days = (now - d) / 864e5;
  if (days < 7) return d.toLocaleDateString('en-AU', { weekday: 'short' });
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// Turn URLs into links without dangerouslySetInnerHTML
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
export function Linkify({ text }) {
  return String(text).split(URL_RE).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-sky-600 underline" onClick={(e) => e.stopPropagation()}>
        {part}
      </a>
    ) : (
      part
    )
  );
}
