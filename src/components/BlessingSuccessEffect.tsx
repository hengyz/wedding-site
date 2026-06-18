import { useEffect } from 'react';

const FLOATING_HEARTS = ['💕', '✨', '💐', '🌸', '💌'];

interface BlessingSuccessEffectProps {
  name: string;
  content: string;
  onComplete: () => void;
}

export function BlessingSuccessEffect({
  name,
  content,
  onComplete,
}: BlessingSuccessEffectProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="blessing-success-overlay" aria-live="polite" aria-label="祝福已送出">
      <div className="blessing-success-backdrop" aria-hidden />

      <div className="blessing-success-fly-card">
        <div className="blessing-glass-shine" aria-hidden />
        <div className="relative z-[1] flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blush-200/90 to-champagne-400/70 text-sm font-semibold text-champagne-600 ring-1 ring-white/60">
            {name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
              {content}
            </p>
          </div>
        </div>
      </div>

      {FLOATING_HEARTS.map((heart, i) => (
        <span
          key={heart}
          className="blessing-success-heart"
          style={{ '--heart-i': i } as React.CSSProperties}
          aria-hidden
        >
          {heart}
        </span>
      ))}

      <p className="blessing-success-message">祝福已送出 💌</p>
    </div>
  );
}
