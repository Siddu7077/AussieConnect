import { useEffect, useState } from 'react';
import { getSaved, toggleSaved } from '../api/client.js';

// Saved post ids, kept in sync across components and tabs
export default function useSaved() {
  const [saved, setSaved] = useState(getSaved);
  useEffect(() => {
    const sync = () => setSaved(getSaved());
    window.addEventListener('ac-saved', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ac-saved', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { saved, isSaved: (id) => saved.includes(id), toggle: toggleSaved };
}
