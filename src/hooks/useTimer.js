import { useState, useEffect, useRef, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";

/**
 * Drift-free countdown. Status: idle | running | paused | finished.
 * The running state (end timestamp) is saved, so a page reload keeps counting.
 */
export default function useTimer({ initialTotal, onFinish }) {
  const [saved, setSaved] = useLocalStorage("cd.timer", {
    total: initialTotal,
    remaining: initialTotal,
    status: "idle",
    endAt: 0,
  });

  // Restore on first load: a timer that ran out while the tab was closed is finished.
  const [state, setState] = useState(() => {
    if (saved.status === "running") {
      const left = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
      return left > 0
        ? { ...saved, remaining: left }
        : { ...saved, remaining: 0, status: "finished" };
    }
    return saved;
  });
  const { total, remaining, status } = state;
  const endAt = useRef(state.endAt || 0);

  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  });

  useEffect(() => {
    setSaved({ ...state, endAt: endAt.current });
  }, [state, setSaved]);

  useEffect(() => {
    if (status !== "running") return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setState((s) => (s.remaining === left ? s : { ...s, remaining: left }));
      if (left === 0) {
        setState((s) => ({ ...s, remaining: 0, status: "finished" }));
        finishRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [status]);

  const start = useCallback((secs) => {
    endAt.current = Date.now() + secs * 1000;
    setState((s) => ({ ...s, total: secs, remaining: secs, status: "running" }));
  }, []);

  const pause = useCallback(() => setState((s) => ({ ...s, status: "paused" })), []);

  const resume = useCallback(() => {
    setState((s) => {
      endAt.current = Date.now() + s.remaining * 1000;
      return { ...s, status: "running" };
    });
  }, []);

  const reset = useCallback(
    () => setState((s) => ({ ...s, remaining: s.total, status: "idle" })),
    []
  );

  /** Set duration (only meaningful while idle). */
  const setDuration = useCallback(
    (secs) => setState((s) => ({ ...s, total: secs, remaining: secs, status: "idle" })),
    []
  );

  /** Add (or subtract) seconds to a running/paused timer. */
  const addTime = useCallback((secs) => {
    setState((s) => {
      if (s.status !== "running" && s.status !== "paused") return s;
      const remaining = Math.max(1, s.remaining + secs);
      if (s.status === "running") endAt.current = Date.now() + remaining * 1000;
      return { ...s, remaining, total: Math.max(s.total, remaining) };
    });
  }, []);

  return { total, remaining, status, start, pause, resume, reset, setDuration, addTime };
}
