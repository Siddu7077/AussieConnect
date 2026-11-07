import { Link, useParams } from 'react-router-dom';
import useFetch from '../api/useFetch.js';
import PostCard from '../components/PostCard.jsx';
import { FeedSkeleton, ErrorMsg } from '../components/Status.jsx';

export default function PostPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`posts.php?id=${Number(id) || 0}`);

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-emerald-700">
        ← All posts
      </Link>
      {loading && !data ? (
        <FeedSkeleton count={1} />
      ) : error ? (
        <ErrorMsg error={error.status === 404 ? { message: 'This post is no longer available.' } : error} onRetry={error.status === 404 ? null : reload} />
      ) : (
        <PostCard post={data} defaultOpenComments />
      )}
    </div>
  );
}
