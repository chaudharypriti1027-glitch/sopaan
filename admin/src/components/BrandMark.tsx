interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'light' | 'dark';
}

export function BrandMark({ size = 'md', showTagline = true, variant = 'dark' }: BrandMarkProps) {
  const box = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const icon = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;

  return (
    <div className={`brand-mark brand-mark--${variant} brand-mark--${size}`}>
      <div className="brand-mark-icon" style={{ width: box, height: box }}>
        <svg viewBox="0 0 24 24" width={icon} height={icon} aria-hidden>
          <rect x="4" y="16.5" width="16" height="4" rx="1.4" fill="currentColor" opacity="0.95" />
          <rect x="6.5" y="11" width="11" height="4" rx="1.4" fill="currentColor" opacity="0.75" />
          <rect x="9" y="5.5" width="6" height="4" rx="1.4" fill="currentColor" opacity="0.55" />
        </svg>
      </div>
      <div className="brand-mark-text">
        <strong>Sopaan</strong>
        {showTagline ? <span>Admin Console</span> : null}
      </div>
    </div>
  );
}
