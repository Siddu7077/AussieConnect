import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PostsFeed from './pages/PostsFeed.jsx';
import QnA from './pages/QnA.jsx';
import Admin from './pages/Admin.jsx';

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

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/questions', label: 'Q&A', Icon: QAIcon },
  { to: '/admin', label: 'Admin', Icon: AdminIcon },
];

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-lg shadow-md shadow-emerald-500/30">
            🦘
          </span>
          <h1 className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Aussie Connect
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-4 sm:px-6">
        <Routes>
          <Route path="/" element={<PostsFeed />} />
          <Route path="/questions" element={<QnA />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <ul className="pointer-events-auto flex w-full max-w-sm gap-1 rounded-full bg-white/90 p-1.5 shadow-xl shadow-emerald-900/10 ring-1 ring-black/5 backdrop-blur-xl">
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