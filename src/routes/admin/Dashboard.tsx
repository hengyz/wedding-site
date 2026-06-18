import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, SITE_MODES, type Blessing, type RsvpResponse, type SiteConfig } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { formatWeddingDate } from '../../lib/date';
import { resolveEffectiveMode } from '../../lib/mode';
import { Card } from '../../components/Card';

function NavBadge({
  count,
  tone = 'neutral',
}: {
  count: number;
  tone?: 'alert' | 'neutral';
}) {
  if (count <= 0) return null;

  const toneClass =
    tone === 'alert'
      ? 'bg-red-500 text-white'
      : 'bg-champagne-500 text-white';

  return (
    <span
      className={`absolute right-2 top-2 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium leading-none ${toneClass}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<(SiteConfig & { updated_at?: string }) | null>(null);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      api.adminGetConfig(),
      api.adminGetBlessings().catch(() => [] as Blessing[]),
      api.adminGetRsvp().catch(() => [] as RsvpResponse[]),
    ])
      .then(([cfg, blessingList, rsvpList]) => {
        setConfig(cfg);
        setBlessings(blessingList);
        setRsvps(rsvpList);
      })
      .catch((err) => {
        console.error(err);
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          navigate('/admin/login', { replace: true });
          return;
        }
        setLoadError(err instanceof Error ? err.message : '加载失败');
      });
  }, [navigate]);

  const stats = useMemo(() => ({
    pendingBlessings: blessings.filter((b) => b.status === 'pending').length,
    rsvpTotal: rsvps.length,
    needPickup: rsvps.filter((r) => r.transport_type === 'need_pickup').length,
  }), [blessings, rsvps]);

  if (loadError) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-red-500">{loadError}</p>
        <p className="text-sm text-gray-500">请重新登录后再试</p>
      </div>
    );
  }

  if (!config) {
    return <div className="text-center text-gray-400 py-12">加载中...</div>;
  }

  const effectiveMode = resolveEffectiveMode(config.wedding_date);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-medium mb-2">
          {config.couple_display_name || `${config.groom_name} & ${config.bride_name}`}
        </h2>
        <p className="text-xs text-gray-400">{config.couple_name}</p>
        <p className="text-sm text-gray-500">{formatWeddingDate(config.wedding_date)}</p>
        <p className="text-sm text-gray-500 mt-1">{config.venue_name}</p>
        <div className="mt-3 rounded-xl border border-cream-200 bg-cream-50 px-3 py-2.5">
          <p className="text-xs text-gray-500">当前网站模式</p>
          <p className="mt-0.5 text-sm font-medium text-champagne-600">
            {SITE_MODES[effectiveMode]}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            根据婚礼日期（北京时间）自动切换
          </p>
        </div>
      </Card>

      {(stats.pendingBlessings > 0 || stats.needPickup > 0) && (
        <Card className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">待办事项</h3>
          {stats.pendingBlessings > 0 && (
            <Link
              to="/admin/blessings"
              className="flex items-center justify-between rounded-xl bg-yellow-50 px-3 py-2.5 text-sm transition hover:bg-yellow-100"
            >
              <span className="text-yellow-800">祝福待审核</span>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                {stats.pendingBlessings}
              </span>
            </Link>
          )}
          {stats.needPickup > 0 && (
            <Link
              to="/admin/rsvp"
              className="flex items-center justify-between rounded-xl bg-blush-100/80 px-3 py-2.5 text-sm transition hover:bg-blush-100"
            >
              <span className="text-champagne-700">宾客需接站</span>
              <span className="rounded-full bg-champagne-500 px-2 py-0.5 text-xs font-medium text-white">
                {stats.needPickup}
              </span>
            </Link>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/config" className="relative block">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">⚙️</span>
            <p className="text-sm mt-1">网站配置</p>
          </Card>
        </Link>
        <Link to="/admin/schedules" className="relative block">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">📋</span>
            <p className="text-sm mt-1">婚礼流程</p>
          </Card>
        </Link>
        <Link to="/admin/photos" className="relative block">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">🖼️</span>
            <p className="text-sm mt-1">相册管理</p>
          </Card>
        </Link>
        <Link to="/admin/blessings" className="relative block">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <NavBadge count={stats.pendingBlessings} tone="alert" />
            <span className="text-2xl">💌</span>
            <p className="text-sm mt-1">祝福审核</p>
          </Card>
        </Link>
        <Link to="/admin/rsvp" className="relative block">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <NavBadge count={stats.rsvpTotal} />
            <span className="text-2xl">📝</span>
            <p className="text-sm mt-1">宾客回执</p>
            {stats.rsvpTotal > 0 && (
              <p className="mt-0.5 text-[10px] text-gray-400">
                {stats.needPickup > 0 ? `${stats.needPickup} 需接站` : '已收到回执'}
              </p>
            )}
          </Card>
        </Link>
      </div>

      <Link to="/" className="block text-center text-sm text-champagne-600 underline">
        查看前台网站 →
      </Link>
    </div>
  );
}
