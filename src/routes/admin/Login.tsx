import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { setToken } from '../../lib/auth';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.adminLogin(password);
      setToken(token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-serif text-xl font-semibold text-center text-champagne-600 mb-6">
          管理员登录
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入管理密码"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
