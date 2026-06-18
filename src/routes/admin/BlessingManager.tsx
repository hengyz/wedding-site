import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, type Blessing } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
];

const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function BlessingManager() {
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api.adminGetBlessings()
      .then(setBlessings)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : '加载失败');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    all: blessings.length,
    pending: blessings.filter((b) => b.status === 'pending').length,
    approved: blessings.filter((b) => b.status === 'approved').length,
    rejected: blessings.filter((b) => b.status === 'rejected').length,
  }), [blessings]);

  const filtered = filter === 'all'
    ? blessings
    : blessings.filter((b) => b.status === filter);

  const updateStatus = async (id: number, status: string) => {
    setError('');
    setMessage('');
    setUpdatingId(id);
    try {
      await api.adminUpdateBlessing(id, status);
      setBlessings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      setMessage('已更新');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const approveAllPending = async () => {
    const pending = counts.pending;
    if (pending === 0) return;

    if (!window.confirm(`确定通过全部 ${pending} 条待审核祝福？`)) {
      return;
    }

    setError('');
    setMessage('');
    setBatchLoading(true);
    try {
      const { updated } = await api.adminApproveAllPendingBlessings();
      setBlessings((prev) =>
        prev.map((b) =>
          b.status === 'pending' ? { ...b, status: 'approved' } : b
        )
      );
      setMessage(`已通过 ${updated} 条祝福`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '批量通过失败');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">
          祝福审核
          {counts.pending > 0 && (
            <span className="ml-2 rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
              {counts.pending}
            </span>
          )}
        </h2>
        {filter === 'pending' && counts.pending > 0 && (
          <Button
            size="sm"
            disabled={batchLoading || loading}
            onClick={approveAllPending}
          >
            {batchLoading ? '处理中...' : `全部通过 (${counts.pending})`}
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm transition ${
              filter === f.key ? 'bg-champagne-500 text-white' : 'bg-gray-100'
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className="ml-1 opacity-80">({counts[f.key]})</span>
            )}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400 py-12">加载中...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id} padding="sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{b.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status || 'pending']}`}>
                      {statusLabels[b.status || 'pending']}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{b.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{b.created_at}</p>
                </div>
              </div>
              {b.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    disabled={updatingId === b.id || batchLoading}
                    onClick={() => updateStatus(b.id, 'approved')}
                  >
                    {updatingId === b.id ? '处理中...' : '通过'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={updatingId === b.id || batchLoading}
                    onClick={() => updateStatus(b.id, 'rejected')}
                  >
                    拒绝
                  </Button>
                </div>
              )}
              {b.status === 'approved' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  disabled={updatingId === b.id || batchLoading}
                  onClick={() => updateStatus(b.id, 'rejected')}
                >
                  隐藏
                </Button>
              )}
              {b.status === 'rejected' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  disabled={updatingId === b.id || batchLoading}
                  onClick={() => updateStatus(b.id, 'approved')}
                >
                  恢复显示
                </Button>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              {filter === 'pending' ? '暂无待审核祝福' : '暂无祝福'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
