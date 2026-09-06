import { useState, useEffect, useRef } from 'react';

/**
 * useState yang menyimpan nilai ke localStorage dan memulihkannya
 * saat halaman dibuka kembali (filter bertahan saat pindah halaman).
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  const first = useRef(true);
  useEffect(() => {
    // Lewati penulisan saat mount pertama (nilai sudah dari storage)
    if (first.current) { first.current = false; return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ }
  }, [key, value]);

  return [value, setValue];
}

/** Hapus nilai tersimpan (dipakai saat reset filter). */
export function clearPersistent(key: string) {
  try { localStorage.removeItem(key); } catch { /* abaikan */ }
}
