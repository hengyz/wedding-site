import type { Blessing } from '../lib/api';

const AVATAR_GRADIENTS = [
  'from-blush-200/90 to-blush-300/80',
  'from-champagne-400/50 to-champagne-500/70',
  'from-rose-100/90 to-pink-200/80',
  'from-amber-100/90 to-orange-200/70',
  'from-violet-100/80 to-purple-200/70',
  'from-sky-100/80 to-blue-200/70',
];

const ACCENT_DOTS = ['💕', '✨', '🌸', '💐', '🤍', '🎀'];

function formatBlessingDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

interface BlessingCardProps {
  blessing: Blessing;
  index: number;
}

export function BlessingCard({ blessing, index }: BlessingCardProps) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const accent = ACCENT_DOTS[index % ACCENT_DOTS.length];

  return (
    <article className="blessing-glass-card group">
      <div className="blessing-glass-shine" aria-hidden />

      <div className="relative z-[1] flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-sm font-semibold text-champagne-600 shadow-sm ring-1 ring-white/60 transition-transform duration-500 group-hover:scale-105`}
          >
            {blessing.name.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium text-gray-800">{blessing.name}</p>
              <span className="shrink-0 text-xs opacity-40 transition-opacity group-hover:opacity-70">
                {accent}
              </span>
            </div>

            {blessing.created_at && (
              <p className="mt-0.5 text-[11px] tracking-wide text-gray-400/90">
                {formatBlessingDate(blessing.created_at)}
              </p>
            )}

            <p className="mt-2.5 text-sm leading-relaxed text-gray-600/95">
              {blessing.content}
            </p>
          </div>
        </div>
    </article>
  );
}
