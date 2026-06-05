import { useEffect, useState } from 'react';
import { api, ApiError, type Blessing } from '../lib/api';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';

export function BlessingPage() {
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBlessings = () => {
    api.getBlessings().then(setBlessings).catch(console.error);
  };

  useEffect(() => {
    loadBlessings();
  }, []);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="section-title">祝福墙</h1>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="您的姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
            maxLength={20}
          />
          <Textarea
            label="祝福语"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下对新人的祝福..."
            maxLength={200}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '提交中...' : '送出祝福'}
          </Button>
        </form>
      </Card>

      <h2 className="font-serif text-lg text-champagne-600 mb-4 text-center">
        大家的祝福
      </h2>

      <div className="space-y-3">
        {blessings.map((b) => (
          <Card key={b.id} padding="sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-200 text-champagne-600 font-medium">
                {b.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{b.name}</p>
                <p className="mt-1 text-gray-600 text-sm leading-relaxed">{b.content}</p>
              </div>
            </div>
          </Card>
        ))}
        {blessings.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            还没有祝福，来做第一个吧 💕
          </p>
        )}
      </div>
    </div>
  );
}
