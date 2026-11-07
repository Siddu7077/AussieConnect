import { useEffect, useState } from 'react';
import { api, getName, setName } from '../api/client.js';

const field =
  'w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm outline-none ring-emerald-500 placeholder:text-gray-400 focus:bg-white focus:ring-2';

export default function AskModal({ open, onClose, onSubmitted }) {
  const [name, setNameState] = useState(getName());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('questions.php', {
        method: 'POST',
        json: { user_name: name.trim(), question_text: text.trim() },
      });
      setName(name.trim());
      setText('');
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Ask a question"
        className="w-full max-w-md animate-sheet-up space-y-3 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Ask the community</h2>
            <p className="text-xs text-gray-400">We'll answer and post it for everyone.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl leading-none text-gray-500 active:scale-90"
          >
            ×
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setNameState(e.target.value)}
          placeholder="Your name"
          maxLength={100}
          required
          autoFocus
          className={field}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What would you like to ask?"
          maxLength={1000}
          rows={4}
          required
          className={`${field} resize-none`}
        />
        <p className="text-right text-xs text-gray-400">{text.length}/1000</p>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Submit question'}
        </button>
      </form>
    </div>
  );
}