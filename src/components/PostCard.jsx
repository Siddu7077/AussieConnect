import { useRef, useState } from 'react';
import ReactionBar from './ReactionBar.jsx';
import Comments from './Comments.jsx';
import { Avatar, BigHeart, Verified, grad, timeAgo } from './ui.jsx';

export default function PostCard({ post }) {
  const bar = useRef(null);
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(0);
  const [more, setMore] = useState(false);
  const long = post.content.length > 120 || post.content.split('\n').length > 3;

  // Double-tap / double-click the media to ❤️
  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setBurst((b) => b + 1);
      bar.current?.like();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  return (
    <article id={`post-${post.id}`} className="scroll-mt-24 animate-rise overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name="A" brand ring size="h-10 w-10" />
        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1 text-sm font-bold">
            Aussie Connect <Verified className="h-3.5 w-3.5" />
          </p>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      <div onClick={tap} className="relative select-none overflow-hidden bg-gray-100">
        {post.image_url ? (
          <img src={post.image_url} alt="" loading="lazy" draggable="false" className="aspect-[4/5] w-full object-cover" />
        ) : (
          <div className={`flex aspect-square items-center justify-center bg-gradient-to-br ${grad(post.id)} p-8 text-center`}>
            <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow-sm">{post.title}</h2>
          </div>
        )}
        {burst > 0 && (
          <span key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <BigHeart className="h-28 w-28 animate-heart drop-shadow-2xl" />
          </span>
        )}
      </div>

      <div className="space-y-2.5 px-4 pb-4 pt-3">
        <ReactionBar ref={bar} targetType="post" targetId={post.id} />
        <div>
          <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-gray-700 ${more ? '' : 'line-clamp-3'}`}>
            {post.image_url && <span className="mr-1.5 font-bold text-gray-900">{post.title}</span>}
            {post.content}
          </p>
          {long && (
            <button onClick={() => setMore((m) => !m)} className="mt-0.5 text-sm font-medium text-gray-400">
              {more ? 'less' : 'more'}
            </button>
          )}
        </div>
        <Comments target="post" targetId={post.id} initial={post.comments || []} />
      </div>
    </article>
  );
}