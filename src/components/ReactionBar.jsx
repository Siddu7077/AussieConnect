import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { api, getUserId } from '../api/client.js';

// Escapes guarantee these match ALLOWED_EMOJI in config.php (❤️ includes U+FE0F)
export const EMOJIS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F62E}'];
const HEART = EMOJIS[1];

const ReactionBar = forwardRef(function ReactionBar({ targetType, targetId, initialCounts }, ref) {
  const [counts, setCounts] = useState(initialCounts || {});
  const [mine, setMine] = useState([]);
  const [ready, setReady] = useState(Boolean(initialCounts));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Always fetch once: gets fresh counts plus which emojis this device has used
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({
      target_type: targetType,
      target_id: String(targetId),
      user_name: getUserId(),
    });
    api(`reactions.php?${q}`)
      .then((d) => { if (alive) { setCounts(d.counts); setMine(d.mine); setReady(true); } })
      .catch((e) => { if (alive) { setError(e.message); setReady(true); } });
    return () => { alive = false; };
  }, [targetType, targetId]);

  async function toggle(emoji) {
    if (busy) return;
    setBusy(true);
    setError('');
    const prev = { counts, mine };
    const on = mine.includes(emoji);

    // Optimistic update, reconciled with the server response below
    setMine(on ? mine.filter((e) => e !== emoji) : [...mine, emoji]);
    setCounts({ ...counts, [emoji]: Math.max(0, (counts[emoji] || 0) + (on ? -1 : 1)) });

    try {
      const d = await api('reactions.php', {
        method: 'POST',
        json: { target_type: targetType, target_id: targetId, emoji, user_name: getUserId() },
      });
      setCounts(d.counts);
      setMine(d.mine);
    } catch (e) {
      setCounts(prev.counts);
      setMine(prev.mine);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Lets a parent (double-tap on an image) add a ❤️ without ever removing one
  useImperativeHandle(ref, () => ({
    like: () => { if (ready && !mine.includes(HEART)) toggle(HEART); },
  }));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map((emoji) => {
          const active = mine.includes(emoji);
          const n = counts[emoji] || 0;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              disabled={!ready || busy}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-all active:scale-90 disabled:opacity-60 ${
                active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              {n > 0 && <span className="text-xs font-bold">{n}</span>}
            </button>
          );
        })}
      </div>
      {total > 0 && (
        <p className="mt-2 text-xs font-semibold text-gray-500">
          {total} {total === 1 ? 'reaction' : 'reactions'}
        </p>
      )}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default ReactionBar;