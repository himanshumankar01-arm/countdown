const clamp = (v, max) => Math.min(max, Math.max(0, parseInt(v, 10) || 0));

/** Hours / minutes / seconds inputs that edit a total number of seconds. */
export default function DurationInput({ total, onChange, disabled }) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const fields = [
    { key: "h", label: "Hours", unit: "hr", value: h, max: 99 },
    { key: "m", label: "Minutes", unit: "min", value: m, max: 59 },
    { key: "s", label: "Seconds", unit: "sec", value: s, max: 59 },
  ];

  const update = (key, raw, max) => {
    const v = clamp(raw, max);
    const next = { h, m, s, [key]: v };
    onChange(next.h * 3600 + next.m * 60 + next.s);
  };

  return (
    <div className="cd-fields">
      {fields.map((f) => (
        <div className="cd-field" key={f.key}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={f.max}
            value={f.value}
            disabled={disabled}
            aria-label={f.label}
            onFocus={(e) => e.target.select()}
            onChange={(e) => update(f.key, e.target.value, f.max)}
          />
          <span>{f.unit}</span>
        </div>
      ))}
    </div>
  );
}
