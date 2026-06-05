import { useEffect, useState } from 'react';
import { api, type Blessing } from '../../lib/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

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
  const [filter, setFilter] = useState('all');

  const load = () => api.adminGetBlessings().then(setBlessings);

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.adminUpdateBlessing(id, status);
    load();
  };

  const filtered = filter === 'all'
    ? blessings
    : blessings.filter((b) => b.status === filter);

  const pendingCount = blessings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          祝福审核
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
              {pendingCount}
            </span>
          )}
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待审核' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              filter === f.key ? 'bg-champagne-500 text-white' : 'bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

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
                <Button size="sm" onClick={() => updateStatus(b.id, 'approved')}>通过</Button>
                <Button size="sm" variant="danger" onClick={() => updateStatus(b.id, 'rejected')}>拒绝</Button>
              </div>
            )}
            {b.status === 'approved' && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => updateStatus(b.id, 'rejected')}>
                隐藏
              </Button>
            )}
            {b.status === 'rejected' && (
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => updateStatus(b.id, 'approved')}>
                恢复显示
              </Button>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无祝福</p>
        )}
      </div>
    </div>
  );
}
