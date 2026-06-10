import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, type RsvpResponse } from '../../lib/api';
import {
  RSVP_ATTENDANCE_LABELS,
  RSVP_TRANSPORT_LABELS,
  type RsvpAttendance,
} from '../../lib/rsvp';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

type FilterKey = 'all' | RsvpAttendance | 'need_pickup';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'yes', label: '参加' },
  { key: 'maybe', label: '待定' },
  { key: 'no', label: '不参加' },
  { key: 'need_pickup', label: '需要接站' },
];

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return value;
}

function exportCsv(rows: RsvpResponse[]) {
  const headers = [
    '姓名',
    '手机号',
    '是否参加',
    '成人数',
    '儿童数',
    '总人数',
    '抵达时间',
    '离开时间',
    '交通方式',
    '接站地点',
    '备注',
    '提交时间',
  ];

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const lines = rows.map((r) => {
    const total = (r.adult_count ?? 0) + (r.child_count ?? 0);
    return [
      r.name,
      r.phone || '',
      RSVP_ATTENDANCE_LABELS[r.attendance],
      r.adult_count ?? 0,
      r.child_count ?? 0,
      total,
      r.arrival_time || '',
      r.departure_time || '',
      r.transport_type ? RSVP_TRANSPORT_LABELS[r.transport_type] : '',
      r.pickup_location || '',
      r.remark || '',
      r.created_at,
    ]
      .map(escape)
      .join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wedding-rsvp.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" className="text-center">
      <p className="text-xl font-semibold text-champagne-600">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </Card>
  );
}

export function RsvpManager() {
  const [rows, setRows] = useState<RsvpResponse[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.adminGetRsvp()
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const yesRows = rows.filter((r) => r.attendance === 'yes');
    const maybeRows = rows.filter((r) => r.attendance === 'maybe');
    const activeRows = rows.filter((r) => r.attendance !== 'no');

    return {
      confirmed: yesRows.length,
      adults: activeRows.reduce((s, r) => s + (r.adult_count ?? 0), 0),
      children: activeRows.reduce((s, r) => s + (r.child_count ?? 0), 0),
      maybe: maybeRows.length,
      declined: rows.filter((r) => r.attendance === 'no').length,
      pickup: rows.filter(
        (r) => r.transport_type === 'need_pickup' && r.attendance !== 'no'
      ).length,
      selfDrive: rows.filter(
        (r) => r.transport_type === 'self_drive' && r.attendance !== 'no'
      ).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'need_pickup') {
      return rows.filter(
        (r) => r.transport_type === 'need_pickup' && r.attendance !== 'no'
      );
    }
    return rows.filter((r) => r.attendance === filter);
  }, [rows, filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条回执？')) return;
    try {
      await api.adminDeleteRsvp(id);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '删除失败');
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-gray-400">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">宾客回执</h2>
        <Button size="sm" variant="secondary" onClick={() => exportCsv(rows)}>
          导出 CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="已确认参加" value={stats.confirmed} />
        <StatCard label="成人数合计" value={stats.adults} />
        <StatCard label="儿童数合计" value={stats.children} />
        <StatCard label="待定" value={stats.maybe} />
        <StatCard label="不参加" value={stats.declined} />
        <StatCard label="需要接站" value={stats.pickup} />
        <StatCard label="自驾" value={stats.selfDrive} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              filter === f.key ? 'bg-champagne-500 text-white' : 'bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((r) => {
          const total = (r.adult_count ?? 0) + (r.child_count ?? 0);
          return (
            <Card key={r.id} padding="sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs text-champagne-600">
                      {RSVP_ATTENDANCE_LABELS[r.attendance]}
                    </span>
                  </div>
                  {r.phone && (
                    <p className="mt-1 text-xs text-gray-500">📱 {r.phone}</p>
                  )}
                </div>
                <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>
                  删
                </Button>
              </div>

              {r.attendance !== 'no' && (
                <p className="mt-2 text-sm text-gray-600">
                  成人 {r.adult_count} · 儿童 {r.child_count} · 共 {total} 人
                </p>
              )}

              {r.arrival_time && (
                <p className="mt-1 text-xs text-gray-500">抵达 {formatTime(r.arrival_time)}</p>
              )}
              {r.departure_time && (
                <p className="text-xs text-gray-500">离开 {formatTime(r.departure_time)}</p>
              )}
              {r.transport_type && (
                <p className="mt-1 text-xs text-gray-500">
                  交通 {RSVP_TRANSPORT_LABELS[r.transport_type]}
                  {r.pickup_location ? ` · ${r.pickup_location}` : ''}
                </p>
              )}
              {r.remark && (
                <p className="mt-2 text-sm text-gray-600">{r.remark}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">{formatTime(r.created_at)}</p>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-gray-400">暂无回执</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-cream-100 text-left text-xs text-gray-500">
              <th className="px-2 py-2">姓名</th>
              <th className="px-2 py-2">手机</th>
              <th className="px-2 py-2">参加</th>
              <th className="px-2 py-2">成人</th>
              <th className="px-2 py-2">儿童</th>
              <th className="px-2 py-2">总人数</th>
              <th className="px-2 py-2">抵达</th>
              <th className="px-2 py-2">离开</th>
              <th className="px-2 py-2">交通</th>
              <th className="px-2 py-2">接站</th>
              <th className="px-2 py-2">备注</th>
              <th className="px-2 py-2">提交时间</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const total = (r.adult_count ?? 0) + (r.child_count ?? 0);
              return (
                <tr key={r.id} className="border-b border-cream-200 hover:bg-cream-50">
                  <td className="px-2 py-2 font-medium">{r.name}</td>
                  <td className="px-2 py-2 text-gray-500">{r.phone || '—'}</td>
                  <td className="px-2 py-2">{RSVP_ATTENDANCE_LABELS[r.attendance]}</td>
                  <td className="px-2 py-2">{r.adult_count}</td>
                  <td className="px-2 py-2">{r.child_count}</td>
                  <td className="px-2 py-2">{total}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatTime(r.arrival_time)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{formatTime(r.departure_time)}</td>
                  <td className="px-2 py-2">
                    {r.transport_type ? RSVP_TRANSPORT_LABELS[r.transport_type] : '—'}
                  </td>
                  <td className="max-w-[120px] truncate px-2 py-2" title={r.pickup_location || ''}>
                    {r.pickup_location || '—'}
                  </td>
                  <td className="max-w-[140px] truncate px-2 py-2" title={r.remark || ''}>
                    {r.remark || '—'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-400">
                    {formatTime(r.created_at)}
                  </td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>
                      删除
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-gray-400">暂无回执</p>
        )}
      </div>
    </div>
  );
}
