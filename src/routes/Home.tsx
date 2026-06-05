import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type SiteConfig } from '../lib/api';
import { formatWeddingDate, getCountdown, pad } from '../lib/date';
import { Card } from '../components/Card';

const shortcuts = [
  { path: '/wedding', label: '婚礼信息', icon: '💒' },
  { path: '/map', label: '地图导航', icon: '📍' },
  { path: '/video', label: '婚礼 MV', icon: '🎬' },
  { path: '/gallery', label: '相册', icon: '📷' },
  { path: '/live', label: '照片直播', icon: '📡' },
  { path: '/blessing', label: '祝福墙', icon: '💌' },
];

export function Home() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [countdown, setCountdown] = useState(getCountdown(''));

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  useEffect(() => {
    if (!config?.wedding_date) return;
    setCountdown(getCountdown(config.wedding_date));
    const timer = setInterval(() => {
      setCountdown(getCountdown(config.wedding_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [config?.wedding_date]);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-champagne-500">加载中...</div>
      </div>
    );
  }

  const modeLabel =
    config.mode === 'wedding_day'
      ? '今日我们结婚啦'
      : config.mode === 'after_wedding'
        ? '感谢有你'
        : '诚挚邀请您';

  return (
    <div className="pb-8">
      <section className="relative min-h-[70vh] flex flex-col items-center justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.hero_image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        <div className="relative z-10 w-full px-6 pb-16 pt-32 text-center text-white">
          <p className="mb-2 text-sm tracking-[0.3em] uppercase opacity-90">
            {modeLabel}
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-wide sm:text-5xl">
            {config.couple_name}
          </h1>
          <p className="mt-4 text-lg opacity-90">
            {formatWeddingDate(config.wedding_date)}
          </p>
        </div>
      </section>

      <section className="page-container -mt-8 relative z-20">
        {!countdown.isPast ? (
          <Card className="text-center">
            <p className="text-sm text-gray-500 mb-3">距离婚礼还有</p>
            <div className="flex justify-center gap-3">
              {[
                { val: countdown.days, unit: '天' },
                { val: countdown.hours, unit: '时' },
                { val: countdown.minutes, unit: '分' },
                { val: countdown.seconds, unit: '秒' },
              ].map(({ val, unit }) => (
                <div key={unit} className="flex flex-col items-center">
                  <span className="font-serif text-2xl font-bold text-champagne-600">
                    {pad(val)}
                  </span>
                  <span className="text-xs text-gray-400">{unit}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center">
            <p className="font-serif text-xl text-champagne-600">
              感谢您的到来 💕
            </p>
          </Card>
        )}

        <div className="mt-8 grid grid-cols-3 gap-3">
          {shortcuts.map((item) => (
            <Link key={item.path} to={item.path} className="nav-link">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-gray-600">{item.label}</span>
            </Link>
          ))}
        </div>

        <Card className="mt-8 text-center">
          <p className="text-sm text-gray-500">婚礼地点</p>
          <p className="mt-1 font-medium">{config.venue_name}</p>
          <p className="mt-1 text-sm text-gray-600">{config.venue_address}</p>
          <Link
            to="/map"
            className="mt-3 inline-block text-sm text-champagne-600 underline"
          >
            查看导航 →
          </Link>
        </Card>
      </section>
    </div>
  );
}
