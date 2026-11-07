import { useState } from 'react';
import { Routes, Route, NavLink, Navigate, Link, useMatch } from 'react-router-dom';
import PostsFeed from './pages/PostsFeed.jsx';
import QnA from './pages/QnA.jsx';
import Admin from './pages/Admin.jsx';
import ChatList from './pages/ChatList.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import Saved from './pages/Saved.jsx';
import PostPage from './pages/PostPage.jsx';
import { ToastProvider } from './components/Toast.jsx';

const LOGO = `${import.meta.env.BASE_URL}logo-icon.webp`; // emblem cropped from design/logo-original.png

const base = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-6 w-6',
  'aria-hidden': true,
};
const fillProps = (active) => ({ fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.18 : 1 });

const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5Z" {...fillProps(active)} />
    <path d="M9.5 21v-6h5v6" fill="none" />
  </svg>
);
const QAIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.7A8 8 0 1 1 21 12Z" {...fillProps(active)} />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16h.01" fill="none" />
  </svg>
);
const AdminIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" {...fillProps(active)} />
    <path d="m9 12 2 2 4-4" fill="none" />
  </svg>
);

const ChatIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4V5.5Z" {...fillProps(active)} />
    <path d="M8 9h8M8 12h5" fill="none" />
  </svg>
);
const SavedIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M18 21 12 16.5 6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21Z" {...fillProps(active)} />
  </svg>
);

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/chat', label: 'Chats', Icon: ChatIcon },
  { to: '/questions', label: 'Q&A', Icon: QAIcon },
  { to: '/saved', label: 'Saved', Icon: SavedIcon },
  { to: '/admin', label: 'Admin', Icon: AdminIcon },
];

function Logo() {
  const [failed, setFailed] = useState(false);
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Aussie Connect home">
      {failed ? (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-lg shadow-md shadow-emerald-500/30">
          🦘
        </span>
      ) : (
        <img
          src={LOGO}
          alt="Aussie Connect logo"
          onError={() => setFailed(true)}
          className="h-10 w-10 rounded-full bg-white object-cover ring-1 ring-gray-200"
        />
      )}
      {/* Delete this h1 if your logo already contains the name */}
      <h1 className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
        Aussie Connect
      </h1>
    </Link>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

function Shell() {
  // A chat room takes over the whole screen, like Telegram/WhatsApp
  const room = useMatch('/chat/:slug');
  if (room) return <ChatRoom key={room.params.slug} slug={room.params.slug} />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4 sm:px-6">
        <Routes>
          <Route path="/" element={<PostsFeed />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/questions" element={<QnA />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/p/:id" element={<PostPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <ul className="pointer-events-auto flex w-full max-w-md gap-0.5 rounded-full bg-white/90 p-1.5 shadow-xl shadow-emerald-900/10 ring-1 ring-black/5 backdrop-blur-xl">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold transition-all active:scale-95 ${
                    isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon active={isActive} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}