type Props = {
  size?: number;
  className?: string;
};

export function BeeMark({ size = 28, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <ellipse cx="16" cy="18" rx="9" ry="7" fill="#F5B731" />
      <ellipse cx="16" cy="18" rx="9" ry="7" fill="url(#bee-stripes)" />
      <ellipse cx="10" cy="13" rx="5" ry="4" fill="rgba(255,255,255,0.35)" />
      <circle cx="22" cy="12" r="5" fill="#2B2218" opacity="0.85" />
      <circle cx="23" cy="11" r="1.2" fill="#FFF5F8" />
      <path
        d="M8 10c-2-3-1-6 2-7M24 10c2-3 1-6-2-7"
        stroke="#2B2218"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <defs>
        <pattern
          id="bee-stripes"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-12)"
        >
          <rect width="6" height="2.2" fill="#2B2218" opacity="0.55" />
          <rect y="3" width="6" height="3" fill="transparent" />
        </pattern>
      </defs>
    </svg>
  );
}
