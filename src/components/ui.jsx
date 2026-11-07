// Shared visual bits: gradient ring, avatars, relative dates, heart icon.
export const RING = 'bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-500';

const PALETTE = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
];

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export const grad = (key) => PALETTE[hash(key) % PALETTE.length];

export function Avatar({ name = '?', size = 'h-10 w-10', ring = false, brand = false, className = '' }) {
  const initial = (String(name).trim()[0] || '?').toUpperCase();
  const bg = brand ? 'from-emerald-500 to-teal-600' : grad(name);
  return (
    <span className={`inline-flex shrink-0 rounded-full ${size} ${ring ? `${RING} p-[2px]` : ''} ${className}`}>
      <span
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${bg} text-[0.85em] font-bold text-white ${
          ring ? 'ring-2 ring-white' : ''
        }`}
      >
        {brand ? (
          <img src="/logo.png" alt="" className="h-full w-full bg-white object-contain p-0.5" />
        ) : (
          initial
        )}
      </span>
    </span>
  );
}



export function timeAgo(s) {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 864e5);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: days > 300 ? 'numeric' : undefined });
}

export function Verified({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Verified">
      <circle cx="12" cy="12" r="11" fill="#10b981" />
      <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BigHeart({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#fff"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}
