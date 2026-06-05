import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, SITE_MODES, type SiteConfig } from '../../lib/api';
import { formatWeddingDate } from '../../lib/date';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export function AdminDashboard() {
  const [config, setConfig] = useState<(SiteConfig & { updated_at?: string }) | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.adminGetConfig()
      .then(setConfig)
      .catch((err) => {
        console.error(err);
        setLoadError(err instanceof Error ? err.message : '加载失败');
      });
  }, []);

  const switchMode = async (mode: SiteConfig['mode']) => {
    const updated = await api.adminUpdateConfig({ mode });
    setConfig(updated);
  };

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

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-medium mb-2">{config.couple_name}</h2>
        <p className="text-sm text-gray-500">{formatWeddingDate(config.wedding_date)}</p>
        <p className="text-sm text-gray-500 mt-1">{config.venue_name}</p>
        <p className="mt-2 text-xs text-champagne-600">
          当前模式：{SITE_MODES[config.mode]}
        </p>
      </Card>

      <Card>
        <h3 className="font-medium mb-3 text-sm">一键切换模式</h3>
        <div className="flex flex-col gap-2">
          {(Object.keys(SITE_MODES) as SiteConfig['mode'][]).map((mode) => (
            <Button
              key={mode}
              variant={config.mode === mode ? 'primary' : 'secondary'}
              size="sm"
              fullWidth
              onClick={() => switchMode(mode)}
            >
              {SITE_MODES[mode]}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/config">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">⚙️</span>
            <p className="text-sm mt-1">网站配置</p>
          </Card>
        </Link>
        <Link to="/admin/schedules">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">📋</span>
            <p className="text-sm mt-1">婚礼流程</p>
          </Card>
        </Link>
        <Link to="/admin/photos">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">🖼️</span>
            <p className="text-sm mt-1">相册管理</p>
          </Card>
        </Link>
        <Link to="/admin/blessings">
          <Card className="text-center hover:border-champagne-400 transition cursor-pointer">
            <span className="text-2xl">💌</span>
            <p className="text-sm mt-1">祝福审核</p>
          </Card>
        </Link>
      </div>

      <Link to="/" className="block text-center text-sm text-champagne-600 underline">
        查看前台网站 →
      </Link>
    </div>
  );
}
