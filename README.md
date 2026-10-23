# Countdown Timer v2 (React + Vite)

## Features

- **Circular progress ring** with large tabular time; turns red in the last 10 s, green when done
- **Hours / minutes / seconds** duration (up to 99:59:59)
- **Timer & Pomodoro modes** – Focus 25 / Short break 5 / Long break 15, long break every 4th focus, optional auto-start of the next session, cycle dots
- **Presets you can save and remove** (stored in the browser)
- **Add / remove time while running** (−10s, +10s, +1m, +5m)
- **Optional label** for what you're timing
- **Alarm sound** (WebAudio chime, no asset files) and **desktop notifications**
- **Survives reload** – a running timer keeps counting; one that ended while the tab was closed shows as finished
- **Recent sessions** history (last 5 shown, 20 kept)
- **Theme**: system / light / dark toggle, remembered
- **Fullscreen focus mode**
- **Keyboard shortcuts**: `Space` start/pause/resume · `R` reset · `A` +1 min · `M` mute · `F` fullscreen
- Time shown in the browser tab title; responsive; respects reduced-motion

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  App.jsx
  components/  Countdown (main), Ring, DurationInput, Icons, Countdown.css
  hooks/       useTimer (drift-free timer + persistence), useLocalStorage
  utils/       time.js (formatting), alarm.js (sound + notifications)
```

## Props

| Prop             | Type       | Default | Description                        |
|------------------|------------|---------|------------------------------------|
| `initialSeconds` | `number`   | `300`   | Starting duration on first load    |
| `onFinish`       | `function` | -       | Called when any timer reaches zero |
