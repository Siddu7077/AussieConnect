import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => setMsg({ text, key: Date.now() }), []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4">
          <div key={msg.key} role="status" className="animate-rise rounded-full bg-gray-900/95 px-5 py-2.5 text-center text-sm font-medium text-white shadow-2xl">
            {msg.text}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
