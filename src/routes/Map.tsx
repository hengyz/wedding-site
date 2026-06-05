import { useEffect, useState } from 'react';
import { api, type SiteConfig } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

function buildMapUrl(
  type: 'amap' | 'baidu' | 'tencent',
  config: SiteConfig
): string {
  const address = encodeURIComponent(config.venue_address);
  const name = encodeURIComponent(config.venue_name);

  if (type === 'amap' && config.amap_url) return config.amap_url;
  if (type === 'baidu' && config.baidu_map_url) return config.baidu_map_url;
  if (type === 'tencent' && config.tencent_map_url) return config.tencent_map_url;

  if (type === 'amap') {
    return `https://uri.amap.com/marker?position=&name=${name}&address=${address}&src=wedding&coordinate=gaode&callnative=1`;
  }
  if (type === 'baidu') {
    return `https://api.map.baidu.com/marker?title=${name}&content=${address}&output=html&src=webapp`;
  }
  return `https://apis.map.qq.com/uri/v1/search?keyword=${name}&referer=wedding`;
}

export function MapPage() {
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

  const maps = [
    { type: 'amap' as const, label: '高德地图', color: 'bg-blue-500' },
    { type: 'baidu' as const, label: '百度地图', color: 'bg-red-500' },
    { type: 'tencent' as const, label: '腾讯地图', color: 'bg-green-500' },
  ];

  return (
    <div className="page-container">
      <h1 className="section-title">地图导航</h1>

      <Card className="mb-6 text-center">
        <p className="text-3xl mb-3">📍</p>
        <p className="font-serif text-xl font-semibold">{config.venue_name}</p>
        <p className="mt-2 text-gray-600">{config.venue_address}</p>
      </Card>

      <div className="space-y-3">
        {maps.map((map) => (
          <a
            key={map.type}
            href={buildMapUrl(map.type, config)}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button fullWidth size="lg" className={`${map.color} hover:opacity-90 border-0`}>
              打开{map.label}
            </Button>
          </a>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        点击按钮将跳转至对应地图 App 或网页版
      </p>
    </div>
  );
}
