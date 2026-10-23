const R = 112;
const C = 2 * Math.PI * R;

/** Circular progress ring; children render in the centre. */
export default function Ring({ percent, tone, children }) {
  return (
    <div className={`cd-ring ${tone}`}>
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <circle className="cd-ring-track" cx="130" cy="130" r={R} />
        <circle
          className="cd-ring-fill"
          cx="130"
          cy="130"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - percent / 100)}
          transform="rotate(-90 130 130)"
        />
      </svg>
      <div className="cd-ring-center">{children}</div>
    </div>
  );
}
