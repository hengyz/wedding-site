import { useEffect, useState } from 'react';
import { api, type SiteConfig } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Live() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  if (!config) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="text-champagne-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="section-title">照片直播</h1>

      <Card className="text-center py-10">
        <div className="text-5xl mb-4">📡</div>
        <p className="text-gray-600 mb-2">婚礼现场照片实时更新</p>
        <p className="text-sm text-gray-400 mb-8">
          摄影师将在婚礼当天上传现场精彩瞬间
        </p>

        {config.photo_live_url ? (
          <a href={config.photo_live_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" fullWidth>
              查看现场照片直播
            </Button>
          </a>
        ) : (
          <p className="text-gray-400">直播链接即将公布</p>
        )}
      </Card>
    </div>
  );
}
