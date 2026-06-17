import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { BlessingCard } from '../components/BlessingCard';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { usePageLoad } from '../hooks/usePageLoad';
import { PageError, PageLoading } from '../components/PageState';

const glassInputClass =
  'border-white/50 bg-white/40 backdrop-blur-sm placeholder:text-gray-400/70 focus:border-champagne-400/60 focus:bg-white/55 focus:ring-champagne-400/20';

export function BlessingPage() {
  const {
    data: blessings,
    loading: listLoading,
    error: listError,
    retry: reloadBlessings,
  } = usePageLoad(() => api.getBlessings());
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim() || !content.trim()) {
      setError('请填写姓名和祝福语');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitBlessing({ name, content });
      setMessage(res.message);
      setName('');
      setContent('');
      reloadBlessings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blessing-page relative">
      <div className="blessing-ambient" aria-hidden>
        <div className="blessing-blob blessing-blob-1" />
        <div className="blessing-blob blessing-blob-2" />
        <div className="blessing-blob blessing-blob-3" />
      </div>

      <div className="blessing-container relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-4">
        <header className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.35em] text-champagne-500/80">
            Blessings
          </p>
          <h1 className="font-serif text-3xl font-semibold text-champagne-600 sm:text-4xl">
            祝福墙
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500/90">
            写下你的心意，让祝福像卡片一样轻轻飘进我们的婚礼
          </p>
        </header>

        <section className="blessing-glass-panel mb-10 p-5 sm:p-6">
          <div className="blessing-glass-shine" aria-hidden />
          <form onSubmit={handleSubmit} className="relative z-[1] space-y-4">
            <div className="mb-1">
              <h2 className="font-serif text-lg text-champagne-600">送出祝福</h2>
              <p className="text-xs text-gray-500/80">审核通过后将展示在祝福墙</p>
            </div>

            <Input
              label="您的姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              maxLength={20}
              className={glassInputClass}
            />
            <Textarea
              label="祝福语"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下对新人的祝福..."
              maxLength={200}
              className={glassInputClass}
            />

            {error && (
              <p className="rounded-xl bg-red-50/70 px-3 py-2 text-sm text-red-500 backdrop-blur-sm">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-green-50/70 px-3 py-2 text-sm text-green-600 backdrop-blur-sm">
                {message}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="blessing-submit-btn shadow-lg shadow-champagne-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-champagne-500/30"
            >
              {loading ? '提交中...' : '送出祝福 💌'}
            </Button>
          </form>
        </section>

        <section>
          <div className="mb-6 text-center">
            <h2 className="font-serif text-xl text-champagne-600">大家的祝福</h2>
            {blessings && blessings.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">{blessings.length} 条温暖心意</p>
            )}
          </div>

          {listError ? (
            <PageError
              message={listError}
              onRetry={reloadBlessings}
              className="blessing-glass-panel flex flex-col items-center justify-center gap-3 py-10 px-6 text-center"
              hint="无法加载祝福列表"
            />
          ) : listLoading ? (
            <PageLoading className="blessing-glass-panel py-14 text-center" label="加载中..." />
          ) : !blessings || blessings.length === 0 ? (
            <div className="blessing-glass-panel py-14 text-center">
              <div className="blessing-glass-shine" aria-hidden />
              <p className="relative z-[1] text-3xl">💕</p>
              <p className="relative z-[1] mt-3 text-sm text-gray-400">
                还没有祝福，来做第一个吧
              </p>
            </div>
          ) : (
            <div className="blessing-masonry">
              {blessings.map((b, index) => (
                <BlessingCard key={b.id} blessing={b} index={index} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
