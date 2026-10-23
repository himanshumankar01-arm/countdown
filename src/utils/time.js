export const pad = (n) => String(n).padStart(2, "0");

/** 3725 -> "1:02:05", 125 -> "02:05" */
export function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** 3725 -> "1h 2m 5s" */
export function formatLong(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h && `${h}h`, m && `${m}m`, (sec || (!h && !m)) && `${sec}s`]
    .filter(Boolean)
    .join(" ");
}

export const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59;
