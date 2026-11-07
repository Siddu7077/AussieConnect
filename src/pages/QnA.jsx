import { useEffect, useState } from 'react';
import useFetch from '../api/useFetch.js';
import QuestionCard from '../components/QuestionCard.jsx';
import AskModal from '../components/AskModal.jsx';
import { FeedSkeleton, ErrorMsg, Empty } from '../components/Status.jsx';

export default function QnA() {
  const { data, loading, error, reload } = useFetch('answers.php');
  const [askOpen, setAskOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  let body;
  if (loading && !data) body = <FeedSkeleton count={3} />;
  else if (error) body = <ErrorMsg error={error} onRetry={reload} />;
  else if (!data.length) body = <Empty icon="💬">No answered questions yet. Be the first to ask!</Empty>;
  else body = <div className="space-y-4">{data.map((item) => <QuestionCard key={item.id} item={item} />)}</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-600/20">
        <p className="text-2xl">🦘</p>
        <h2 className="mt-1 text-xl font-extrabold leading-tight">Got a question?</h2>
        <p className="mt-0.5 text-sm text-emerald-50/90">Ask the community and get answers from the team.</p>
        <button
          onClick={() => setAskOpen(true)}
          className="mt-3 rounded-full bg-white px-5 py-2 text-sm font-bold text-emerald-700 shadow active:scale-95"
        >
          Ask a question
        </button>
      </div>

      {body}

      <button
        onClick={() => setAskOpen(true)}
        className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-40 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white shadow-xl shadow-emerald-500/40 transition active:scale-95 sm:right-6"
      >
        ❓ Ask
      </button>

      <AskModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onSubmitted={() => setToast('Question submitted')}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-[calc(10rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 animate-rise rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-2xl"
        >
          ✅ {toast}
        </div>
      )}
    </div>
  );
}