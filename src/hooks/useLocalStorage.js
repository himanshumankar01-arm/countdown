import { useState, useEffect } from "react";

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/** useState that persists to localStorage. Object values are merged over defaults. */
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      return isPlainObject(initial) && isPlainObject(parsed)
        ? { ...initial, ...parsed }
        : parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}
