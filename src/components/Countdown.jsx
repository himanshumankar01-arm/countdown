import { useState, useEffect, useRef, useCallback } from "react";
import "./Countdown.css";
import useTimer from "../hooks/useTimer";
import useLocalStorage from "../hooks/useLocalStorage";
import { formatTime, formatLong, MAX_SECONDS } from "../utils/time";
import { playAlarm, unlockAudio, notify } from "../utils/alarm";
import Ring from "./Ring";
import DurationInput from "./DurationInput";
import * as I from "./Icons";

const DEFAULT_PRESETS = [60, 300, 600, 1500];
const POMO = {
  focus: { label: "Focus", secs: 25 * 60 },
  short: { label: "Short break", secs: 5 * 60 },
  long: { label: "Long break", secs: 15 * 60 },
};
const THEMES = ["system", "light", "dark"];
const THEME_ICON = { system: I.Auto, light: I.Sun, dark: I.Moon };

const nextPomo = (phase, count) => {
  if (phase !== "focus") return { phase: "focus", count };
  const c = count + 1;
  return { phase: c % 4 === 0 ? "long" : "short", count: c };
};

export default function Countdown({ initialSeconds = 300, onFinish }) {
  const [settings, setSettings] = useLocalStorage("cd.settings", {
    theme: "system",
    sound: true,
    notifications: false,
    autoStart: true,
    mode: "timer", // timer | pomodoro
    label: "",
    presets: DEFAULT_PRESETS,
  });
  const [pomo, setPomo] = useLocalStorage("cd.pomo", { phase: "focus", count: 0 });
  const [history, setHistory] = useLocalStorage("cd.history", []);
  const [message, setMessage] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const isPomo = settings.mode === "pomodoro";

  // Latest values for the finish callback (called from inside the timer hook)
  const latest = useRef({});
  const timerRef = useRef(null);

  const handleFinish = useCallback(() => {
    const { settings: s, pomo: p, total } = latest.current;
    const phaseName = s.mode === "pomodoro" ? POMO[p.phase].label : s.label || "Timer";
    if (s.sound) playAlarm();
    if (s.notifications) notify("Time's up", `${phaseName} finished`);
    setHistory((h) =>
      [{ id: Date.now(), name: phaseName, seconds: total, at: Date.now() }, ...h].slice(0, 20)
    );
    onFinish?.();

    if (s.mode === "pomodoro") {
      const n = nextPomo(p.phase, p.count);
      setPomo(n);
      setMessage(`${phaseName} done — up next: ${POMO[n.phase].label}`);
      const t = timerRef.current;
      if (s.autoStart) t.start(POMO[n.phase].secs);
      else t.setDuration(POMO[n.phase].secs);
    } else {
      setMessage("Time's up!");
    }
  }, [onFinish, setHistory, setPomo]);

  const timer = useTimer({ initialTotal: initialSeconds, onFinish: handleFinish });
  const { total, remaining, status } = timer;
  timerRef.current = timer;
  latest.current = { settings, pomo, total };

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // Tab title
  useEffect(() => {
    document.title =
      status === "idle" ? "Countdown Timer" : `${formatTime(remaining)} · Countdown Timer`;
  }, [remaining, status]);

  // Fullscreen sync
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Actions
  const clearMsg = () => setMessage("");
  const start = () => {
    unlockAudio();
    clearMsg();
    timer.start(total);
  };
  const reset = () => {
    clearMsg();
    timer.reset();
  };
  const toggle = () => {
    if (status === "running") timer.pause();
    else if (status === "paused") timer.resume();
    else if (total > 0) start();
  };

  const setMode = (mode) => {
    if (mode === settings.mode) return;
    clearMsg();
    set({ mode });
    if (mode === "pomodoro") {
      const p = { phase: "focus", count: 0 };
      setPomo(p);
      timer.setDuration(POMO.focus.secs);
    } else {
      timer.setDuration(settings.presets[0] ?? 300);
    }
  };
  const jumpPhase = (phase) => {
    clearMsg();
    setPomo((p) => ({ ...p, phase }));
    timer.setDuration(POMO[phase].secs);
  };

  const cycleTheme = () =>
    set({ theme: THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length] });

  const toggleNotifications = async () => {
    if (settings.notifications) return set({ notifications: false });
    if (!("Notification" in window)) return;
    const perm =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    set({ notifications: perm === "granted" });
  };

  const savePreset = () => {
    if (total <= 0 || settings.presets.includes(total)) return;
    set({ presets: [...settings.presets, total].slice(-8) });
  };
  const removePreset = (p) => set({ presets: settings.presets.filter((x) => x !== p) });

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      const k = e.key.toLowerCase();
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (k === "r") reset();
      else if (k === "a") timer.addTime(60);
      else if (k === "f") toggleFullscreen();
      else if (k === "m") set({ sound: !settings.sound });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const editable = status === "idle";
  const active = status === "running" || status === "paused";
  const percent = total > 0 ? (remaining / total) * 100 : 0;
  const warning = status === "running" && remaining <= 10;
  const tone = status === "finished" ? "done" : warning ? "warn" : isPomo && pomo.phase !== "focus" ? "break" : status;
  const ThemeIcon = THEME_ICON[settings.theme];

  const centerLabel = isPomo
    ? POMO[pomo.phase].label
    : settings.label || (status === "finished" ? "Time's up" : status === "idle" ? "Ready" : status);

  return (
    <main className={`cd-card ${fullscreen ? "is-full" : ""} tone-${tone}`}>
      <header className="cd-head">
        <h1>Countdown</h1>
        <div className="cd-tools">
          <button className="cd-icon" onClick={cycleTheme} title={`Theme: ${settings.theme}`} aria-label={`Theme: ${settings.theme}`}>
            <ThemeIcon />
          </button>
          <button className="cd-icon" onClick={() => set({ sound: !settings.sound })} aria-pressed={settings.sound} title="Sound (M)" aria-label="Toggle sound">
            {settings.sound ? <I.VolumeOn /> : <I.VolumeOff />}
          </button>
          <button className="cd-icon" onClick={toggleNotifications} aria-pressed={settings.notifications} title="Desktop notifications" aria-label="Toggle notifications">
            {settings.notifications ? <I.Bell /> : <I.BellOff />}
          </button>
          <button className="cd-icon" onClick={toggleFullscreen} title="Fullscreen (F)" aria-label="Toggle fullscreen">
            {fullscreen ? <I.Collapse /> : <I.Expand />}
          </button>
        </div>
      </header>

      <div className="cd-tabs" role="tablist" aria-label="Mode">
        {["timer", "pomodoro"].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={settings.mode === m}
            className={settings.mode === m ? "on" : ""}
            disabled={active}
            onClick={() => setMode(m)}
          >
            {m === "timer" ? "Timer" : "Pomodoro"}
          </button>
        ))}
      </div>

      {isPomo && (
        <div className="cd-phases">
          {Object.entries(POMO).map(([key, p]) => (
            <button
              key={key}
              className={`cd-chip ${pomo.phase === key ? "on" : ""}`}
              disabled={!editable}
              onClick={() => jumpPhase(key)}
            >
              {p.label}
            </button>
          ))}
          <span className="cd-cycle" title="Completed focus sessions">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < (pomo.phase === "long" ? 4 : pomo.count % 4) ? "on" : ""} />
            ))}
          </span>
        </div>
      )}

      <Ring percent={percent} tone={tone}>
        <div className="cd-label-top">{centerLabel}</div>
        <div className="cd-time" role="timer" aria-live="off">
          {formatTime(remaining)}
        </div>
        <div className="cd-sub">
          {status === "idle" ? `of ${formatLong(total)}` : `${Math.round(percent)}% left`}
        </div>
      </Ring>

      <div className="cd-message" role="status" aria-live="polite">
        {message}
      </div>

      <div className="cd-addtime" aria-label="Adjust time">
        {[
          [-10, "−10s"],
          [10, "+10s"],
          [60, "+1m"],
          [300, "+5m"],
        ].map(([secs, label]) => (
          <button key={label} className="cd-chip" disabled={!active} onClick={() => timer.addTime(secs)}>
            {label}
          </button>
        ))}
      </div>

      <div className="cd-actions">
        <button className="cd-btn ghost" onClick={reset} disabled={status === "idle" && remaining === total} aria-label="Reset (R)">
          <I.Reset /> Reset
        </button>
        <button className="cd-btn primary" onClick={toggle} disabled={status === "idle" && total === 0}>
          {status === "running" ? (
            <><I.Pause /> Pause</>
          ) : status === "paused" ? (
            <><I.Play /> Resume</>
          ) : status === "finished" ? (
            <><I.Play /> Restart</>
          ) : (
            <><I.Play /> Start</>
          )}
        </button>
      </div>

      {!fullscreen && (
        <>
          <section className="cd-setup">
            {!isPomo && (
              <input
                className="cd-text"
                type="text"
                maxLength={40}
                placeholder="What are you timing? (optional)"
                value={settings.label}
                onChange={(e) => set({ label: e.target.value })}
                aria-label="Timer label"
              />
            )}
            {!isPomo && (
              <>
                <label className="cd-label">Duration</label>
                <DurationInput
                  total={total}
                  disabled={!editable}
                  onChange={(s) => timer.setDuration(Math.min(MAX_SECONDS, s))}
                />
                <div className="cd-presets">
                  {settings.presets.map((p) => (
                    <span key={p} className={`cd-preset ${total === p ? "on" : ""}`}>
                      <button className="cd-chip" disabled={!editable} onClick={() => timer.setDuration(p)}>
                        {formatLong(p)}
                      </button>
                      <button className="cd-x" onClick={() => removePreset(p)} aria-label={`Remove ${formatLong(p)} preset`}>
                        <I.Close />
                      </button>
                    </span>
                  ))}
                  <button
                    className="cd-chip add"
                    onClick={savePreset}
                    disabled={!editable || total <= 0 || settings.presets.includes(total)}
                    title="Save current duration as a preset"
                  >
                    <I.Plus /> Save
                  </button>
                </div>
              </>
            )}
            {isPomo && (
              <label className="cd-switch">
                <input type="checkbox" checked={settings.autoStart} onChange={(e) => set({ autoStart: e.target.checked })} />
                <span>Auto-start next session</span>
              </label>
            )}
          </section>

          <section className="cd-history">
            <div className="cd-history-head">
              <label className="cd-label">Recent sessions</label>
              {history.length > 0 && (
                <button className="cd-link" onClick={() => setHistory([])}>
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="cd-empty">Completed timers will appear here.</p>
            ) : (
              <ul>
                {history.slice(0, 5).map((h) => (
                  <li key={h.id}>
                    <span className="cd-h-name">{h.name}</span>
                    <span className="cd-h-meta">
                      {formatLong(h.seconds)} ·{" "}
                      {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <footer className="cd-keys">
            <kbd>Space</kbd> start/pause <kbd>R</kbd> reset <kbd>A</kbd> +1m <kbd>M</kbd> mute <kbd>F</kbd> fullscreen
          </footer>
        </>
      )}
    </main>
  );
}
