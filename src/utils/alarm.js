let ctx;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Call from a user gesture (e.g. Start) so browsers allow sound later. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

/** Three short, soft chimes. */
export function playAlarm() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  [0, 0.35, 0.7].forEach((offset, i) => {
    const t = c.currentTime + offset;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = i === 2 ? 1046 : 784;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}

export function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* ignore */
  }
}
