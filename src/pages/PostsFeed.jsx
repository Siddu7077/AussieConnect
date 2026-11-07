import useFetch from '../api/useFetch.js';
import PostCard from '../components/PostCard.jsx';
import { FeedSkeleton, ErrorMsg, Empty } from '../components/Status.jsx';
import { RING, grad } from '../components/ui.jsx';

function Highlights({ posts }) {
  const go = (id) => document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {posts.slice(0, 12).map((p) => (
        <button key={p.id} onClick={() => go(p.id)} className="w-[68px] shrink-0 text-center active:scale-95">
          <span className={`${RING} mx-auto flex h-[68px] w-[68px] rounded-full p-[2.5px]`}>
            <span className="h-full w-full overflow-hidden rounded-full bg-gray-100 ring-2 ring-white">
              {p.image_url ? (
                <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad(p.id)} text-xl font-bold text-white`}>
                  {(p.title[0] || '?').toUpperCase()}
                </span>
              )}
            </span>
          </span>
          <span className="mt-1.5 block truncate text-[11px] font-medium text-gray-600">{p.title}</span>
        </button>
      ))}
    </div>
  );
}

export default function PostsFeed() {
  const { data, loading, error, reload } = useFetch('posts.php');

  if (loading && !data) return <FeedSkeleton grid count={4} />;
  if (error) return <ErrorMsg error={error} onRetry={reload} />;
  if (!data.length) return <Empty icon="📭">No posts yet. Check back soon!</Empty>;

  return (
    <>
      <Highlights posts={data} />
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {data.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}