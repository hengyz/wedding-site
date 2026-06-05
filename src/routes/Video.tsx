import { useEffect, useState } from 'react';
import { api, type SiteConfig } from '../lib/api';
import { Card } from '../components/Card';

function getEmbedUrl(url: string): { type: 'iframe' | 'video'; src: string } | null {
  if (!url) return null;

  const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
  if (bilibiliMatch) {
    return {
      type: 'iframe',
      src: `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1`,
    };
  }

  const youkuMatch = url.match(/youku\.com\/(?:v_show\/)?id_([\w=]+)/);
  if (youkuMatch) {
    return {
      type: 'iframe',
      src: `https://player.youku.com/embed/${youkuMatch[1]}`,
    };
  }

  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    return { type: 'video', src: url };
  }

  if (url.includes('v.qq.com') || url.includes('video.qq.com')) {
    return { type: 'iframe', src: url.replace('v.qq.com/x/page/', 'v.qq.com/txp/iframe/player.html?vid=') };
  }

  return { type: 'iframe', src: url };
}

export function Video() {
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

  const embed = config.mv_url ? getEmbedUrl(config.mv_url) : null;

  return (
    <div className="page-container">
      <h1 className="section-title">婚礼 MV</h1>

      {!config.mv_url ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">MV 即将上线，敬请期待</p>
        </Card>
      ) : (
        <Card padding="sm" className="overflow-hidden">
          {embed?.type === 'video' ? (
            <video
              src={embed.src}
              controls
              poster={config.mv_cover_url || undefined}
              className="w-full rounded-xl"
            />
          ) : embed ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              {config.mv_cover_url && (
                <img
                  src={config.mv_cover_url}
                  alt="MV 封面"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <iframe
                src={embed.src}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="婚礼 MV"
              />
            </div>
          ) : (
            <a
              href={config.mv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {config.mv_cover_url ? (
                <img
                  src={config.mv_cover_url}
                  alt="MV 封面"
                  className="w-full rounded-xl"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-cream-100 rounded-xl">
                  <span className="text-champagne-600">点击观看 MV →</span>
                </div>
              )}
            </a>
          )}
        </Card>
      )}
    </div>
  );
}
