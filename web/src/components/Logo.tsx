export default function Logo({ size = 30, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="XpenseTracker"
        className="logo-mark"
      >
        <defs>
          <linearGradient id="xt-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9805a" />
            <stop offset="1" stopColor="#c96442" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#xt-grad)" />
        {/* ascending bars = tracking, with an upward tick */}
        <g fill="#ffffff">
          <rect x="7.5" y="18.5" width="4" height="6" rx="1.4" opacity="0.85" />
          <rect x="14" y="14" width="4" height="10.5" rx="1.4" opacity="0.92" />
          <rect x="20.5" y="9" width="4" height="15.5" rx="1.4" />
        </g>
        <path
          d="M7 14.5 L13.5 11 L19 13 L25.5 7.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      </svg>
      {showWord && (
        <span className="logo-word">
          Xpense<span>Tracker</span>
        </span>
      )}
    </span>
  );
}
