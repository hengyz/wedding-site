import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatWeddingDate, getCountdown, pad } from '../lib/date';
import {
  getCoupleDisplayName,
  getInviteLine,
} from '../lib/wedding-display';
import { usePageLoad } from '../hooks/usePageLoad';
import { PageError, PageLoading } from '../components/PageState';

const features = [
  { path: '/wedding', label: '婚礼信息', icon: '💒', desc: '了解婚礼详情' },
  { path: '/map', label: '地图导航', icon: '📍', desc: '查看路线导航' },
  { path: '/video', label: '婚礼 MV', icon: '🎬', desc: '我们的爱情故事' },
  { path: '/gallery', label: '相册', icon: '📷', desc: '珍藏美好瞬间' },
  { path: '/live', label: '照片直播', icon: '📡', desc: '实时记录现场' },
  { path: '/blessing', label: '祝福墙', icon: '💌', desc: '留下您的祝福' },
];

export function Home() {
  const { data: config, loading, error, retry } = usePageLoad(() => api.getConfig());
  const [countdown, setCountdown] = useState(getCountdown(''));

  useEffect(() => {
    if (!config?.wedding_date) return;
    setCountdown(getCountdown(config.wedding_date));
    const timer = setInterval(() => {
      setCountdown(getCountdown(config.wedding_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [config?.wedding_date]);

  if (error) {
    return (
      <PageError
        message={error}
        onRetry={retry}
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      />
    );
  }

  if (loading || !config) {
    return (
      <PageLoading
        className="flex min-h-screen items-center justify-center"
      />
    );
  }

  const coupleTitle = getCoupleDisplayName(config);
  const inviteLine = getInviteLine(config.mode);

  return (
    <div className="home-page">
      <span className="home-deco-heart home-deco-heart-1" aria-hidden>♥</span>
      <span className="home-deco-heart home-deco-heart-2" aria-hidden>♥</span>

      <section className="home-hero">
        <div
          className="home-hero-bg"
          style={
            config.hero_image_url
              ? { backgroundImage: `url(${config.hero_image_url})` }
              : { background: 'linear-gradient(160deg, #8a6238 0%, #b98a55 45%, #f7d9d4 100%)' }
          }
        />
        <div className="home-hero-overlay" />

        <div className="home-hero-content">
          <p className="home-hero-invite">{inviteLine}</p>
          <h1 className="home-hero-title">{coupleTitle}</h1>
          <p className="home-hero-date">{formatWeddingDate(config.wedding_date)}</p>
        </div>

        <div className="home-hero-curve" aria-hidden />
      </section>

      <div className="home-container">
        {!countdown.isPast ? (
          <div className="home-countdown">
            <p className="home-countdown-label">
              <span>距离婚礼还有</span>
            </p>
            <div className="home-countdown-grid">
              {[
                { val: countdown.days, unit: '天' },
                { val: countdown.hours, unit: '时' },
                { val: countdown.minutes, unit: '分' },
                { val: countdown.seconds, unit: '秒' },
              ].map(({ val, unit }) => (
                <div key={unit} className="home-countdown-cell">
                  <span className="home-countdown-num">{pad(val)}</span>
                  <span className="home-countdown-unit">{unit}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="home-countdown">
            <p className="font-serif text-lg text-[var(--color-gold)]">
              感谢您的到来 💕
            </p>
          </div>
        )}

        {config.mode !== 'wedding_day' && (
          <Link to="/rsvp" className="home-rsvp-cta">
            <span className="home-rsvp-icon" aria-hidden>📝</span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base font-semibold text-[var(--color-text)]">
                赴宴回执
              </p>
              <p className="text-xs text-[var(--color-muted)]">告诉我们您是否能来</p>
            </div>
            <span className="home-rsvp-btn">填写回执 →</span>
          </Link>
        )}

        <div className="home-features">
          {features.map((item) => (
            <Link key={item.path} to={item.path} className="home-feature-card">
              <span className="home-feature-icon">{item.icon}</span>
              <span className="home-feature-title">{item.label}</span>
              <span className="home-feature-desc">{item.desc}</span>
              <span className="home-feature-line" aria-hidden />
            </Link>
          ))}
          {config.mode === 'wedding_day' && (
            <Link to="/rsvp" className="home-feature-card opacity-80">
              <span className="home-feature-icon">📝</span>
              <span className="home-feature-title">赴宴回执</span>
              <span className="home-feature-desc">告诉我们是否能来</span>
              <span className="home-feature-line" aria-hidden />
            </Link>
          )}
        </div>

        <div className="home-venue">
          <p className="home-venue-label">婚礼地点</p>
          <p className="home-venue-name">{config.venue_name}</p>
          <p className="home-venue-address">{config.venue_address}</p>
          <Link to="/map" className="home-venue-nav">
            查看导航 →
          </Link>
        </div>
      </div>
    </div>
  );
}
