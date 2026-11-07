import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../api/useFetch.js';
import { getLastRead, getMembership } from '../api/client.js';
import { ErrorMsg } from '../components/Status.jsx';
import { GroupAvatar, chatTime } from '../components/chatUi.jsx';

export default function ChatList() {
  const { data, loading, error, reload } = useFetch('chat.php?action=groups');

  // Refresh previews/counts every 8s while the page is visible
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) reload(); }, 8000);
    return () => clearInterval(t);
  }, [reload]);

  if (error && !data) return <ErrorMsg error={error} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold">Community chats</h2>
        <p className="text-xs text-gray-400">Join your city's group. Just your name, no phone number needed.</p>
      </div>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading && !data
          ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex animate-pulse items-center gap-3 p-4">
                <div className="h-14 w-14 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded-full bg-gray-200" />
                  <div className="h-2.5 w-40 rounded-full bg-gray-100" />
                </div>
              </li>
            ))
          : data.map((g) => {
              const joined = Boolean(getMembership(g.slug));
              const unread = joined && g.last && g.last.id > getLastRead(g.slug);
              return (
                <li key={g.id}>
                  <Link to={`/chat/${g.slug}`} className="flex items-center gap-3 p-4 transition hover:bg-gray-50 active:bg-gray-100">
                    <GroupAvatar group={g} size="h-14 w-14" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-bold">{g.name}</p>
                        {g.last && <span className={`shrink-0 text-xs ${unread ? 'font-semibold text-emerald-600' : 'text-gray-400'}`}>{chatTime(g.last.ts)}</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-gray-500">
                          {g.last ? (
                            <>
                              <span className="font-medium text-gray-700">{g.last.name}: </span>
                              {g.last.body}
                            </>
                          ) : (
                            <span className="italic text-gray-400">No messages yet. Say hi! 👋</span>
                          )}
                        </p>
                        {unread ? (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-label="New messages" />
                        ) : !joined ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Join</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        👥 {g.members.toLocaleString()} {g.members === 1 ? 'member' : 'members'}
                        {g.online > 0 && <span className="text-emerald-600"> · {g.online} online</span>}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
      </ul>
    </div>
  );
}
