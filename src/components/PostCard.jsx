import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommentThread } from './Comments.jsx';
import { EMOJIS } from './ReactionBar.jsx';
import { useToast } from './Toast.jsx';
import useSaved from '../hooks/useSaved.js';
import { api, getUserId, sharePost } from '../api/client.js';
import { Avatar, BigHeart, Verified, grad, timeAgo } from './ui.jsx';

const HEART = EMOJIS[1];

const icon = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

function HeartIcon({ on }) {
  return (
    <svg {...icon} className={`h-[27px] w-[27px] ${on ? 'text-red-500' : ''}`} fill={on ? 'currentColor' : 'none'}>
      <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6a4.8 4.8 0 0 1 6.8 6.8L12 20.3Z" />
    </svg>
  );
}
const CommentIcon = () => (
  <svg {...icon} className="h-[26px] w-[26px] -scale-x-100">
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.5-4.6a8.4 8.4 0 1 1 15.5-4.3Z" />
  </svg>
);
const ShareIcon = () => (
  <svg {...icon} className="h-[25px] w-[25px]">
    <path d="M21.5 3 10.2 14.3M21.5 3 14.6 21l-4.4-6.7L3 10.2 21.5 3Z" />
  </svg>
);
function SaveIcon({ on }) {
  return (
    <svg {...icon} className="h-[26px] w-[26px]" fill={on ? 'currentColor' : 'none'}>
      <path d="M19 21 12 16l-7 5V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21Z" />
    </svg>
  );
}

// ❤️ uses the existing reactions API
function useLike(postId) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [ready, setReady] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ target_type: 'post', target_id: String(postId), user_name: getUserId() });
    api(`reactions.php?${q}`)
      .then((d) => {
        if (!alive) return;
        setCount(d.counts[HEART] || 0);
        setLiked(d.mine.includes(HEART));
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => { alive = false; };
  }, [postId]);

  async function toggle() {
    if (!ready || busy.current) return;
    busy.current = true;
    const prev = { count, liked };
    setLiked(!liked);
    setCount(Math.max(0, count + (liked ? -1 : 1)));
    try {
      const d = await api('reactions.php', {
        method: 'POST',
        json: { target_type: 'post', target_id: postId, emoji: HEART, user_name: getUserId() },
      });
      setCount(d.counts[HEART] || 0);
      setLiked(d.mine.includes(HEART));
    } catch {
      setCount(prev.count);
      setLiked(prev.liked);
    } finally {
      busy.current = false;
    }
  }

  return { count, liked, toggle, like: () => { if (!liked) toggle(); } };
}

export default function PostCard({ post, defaultOpenComments = false }) {
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(0);
  const [more, setMore] = useState(false);
  const [showComments, setShowComments] = useState(defaultOpenComments);
  const [comments, setComments] = useState(post.comments || []);
  const { count, liked, toggle, like } = useLike(post.id);
  const { isSaved, toggle: toggleSave } = useSaved();
  const toast = useToast();
  const saved = isSaved(post.id);
  const long = post.content.length > 120 || post.content.split('\n').length > 3;

  // Double-tap / double-click the media to ❤️
  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setBurst((b) => b + 1);
      like();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  async function share() {
    const r = await sharePost(post);
    if (r === 'copied') toast('🔗 Link copied');
  }

  function save() {
    const on = toggleSave(post.id);
    toast(on ? '🔖 Saved' : 'Removed from saved');
  }

  return (
    <article id={`post-${post.id}`} className="scroll-mt-24 animate-rise overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name="A" brand ring size="h-10 w-10" />
        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1 text-sm font-bold">
            Aussie Connect <Verified className="h-3.5 w-3.5" />
          </p>
          <Link to={`/p/${post.id}`} className="text-xs text-gray-400 hover:underline">{timeAgo(post.created_at)}</Link>
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

      <div className="px-4 pb-4 pt-2">
        <div className="-mx-1.5 flex items-center">
          <button onClick={toggle} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} className="p-1.5 transition active:scale-75">
            <HeartIcon on={liked} />
          </button>
          <button onClick={() => setShowComments((s) => !s)} aria-label="Comments" aria-expanded={showComments} className="p-1.5 transition active:scale-75">
            <CommentIcon />
          </button>
          <button onClick={share} aria-label="Share" className="p-1.5 transition active:scale-75">
            <ShareIcon />
          </button>
          <button onClick={save} aria-pressed={saved} aria-label={saved ? 'Unsave' : 'Save'} className="ml-auto p-1.5 transition active:scale-75">
            <SaveIcon on={saved} />
          </button>
        </div>

        {count > 0 && (
          <p className="mt-1 text-sm font-bold">{count.toLocaleString()} {count === 1 ? 'like' : 'likes'}</p>
        )}

        <div className="mt-1">
          <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-gray-800 ${more ? '' : 'line-clamp-3'}`}>
            <span className="mr-1.5 font-bold text-gray-900">{post.image_url ? post.title : 'aussieconnect'}</span>
            {post.content}
          </p>
          {long && (
            <button onClick={() => setMore((m) => !m)} className="mt-0.5 text-sm font-medium text-gray-400">
              {more ? 'less' : 'more'}
            </button>
          )}
        </div>

        {!showComments && (
          <button onClick={() => setShowComments(true)} className="mt-1 block text-sm text-gray-400">
            {comments.length ? `View ${comments.length === 1 ? '1 comment' : `all ${comments.length} comments`}` : 'Add a comment…'}
          </button>
        )}
        {showComments && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <CommentThread
              target="post"
              targetId={post.id}
              list={comments}
              onAdded={(c) => setComments((l) => [...l, c])}
            />
          </div>
        )}
      </div>
    </article>
  );
}
