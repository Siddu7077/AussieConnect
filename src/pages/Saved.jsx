import { Link } from 'react-router-dom';
import useFetch from '../api/useFetch.js';
import useSaved from '../hooks/useSaved.js';
import { FeedSkeleton, ErrorMsg, Empty } from '../components/Status.jsx';
import { grad } from '../components/ui.jsx';

export default function Saved() {
  const { saved } = useSaved();
  const { data, loading, error, reload } = useFetch('posts.php');

  if (loading && !data) return <FeedSkeleton grid count={2} />;
  if (error) return <ErrorMsg error={error} onRetry={reload} />;

  const byId = new Map(data.map((p) => [p.id, p]));
  const posts = saved.map((id) => byId.get(id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-xl font-extrabold">Saved</h2>
      <p className="mb-4 text-xs text-gray-400">Only you can see what you've saved on this device.</p>
      {!posts.length ? (
        <Empty icon="🔖">Tap the bookmark on any post to save it here.</Empty>
      ) : (
        <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
          {posts.map((p) => (
            <Link key={p.id} to={`/p/${p.id}`} className="relative aspect-square bg-gray-100 active:opacity-80">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad(p.id)} p-2 text-center text-xs font-bold text-white`}>
                  {p.title}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
