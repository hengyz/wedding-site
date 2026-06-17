import { api } from '../lib/api';
import { formatWeddingDate, formatTime } from '../lib/date';
import { Card } from '../components/Card';
import { usePageLoad } from '../hooks/usePageLoad';
import { PageError, PageLoading } from '../components/PageState';

export function Wedding() {
  const { data, loading, error, retry } = usePageLoad(() =>
    Promise.all([api.getConfig(), api.getSchedules()]).then(([config, schedules]) => ({
      config,
      schedules,
    }))
  );

  if (error) {
    return <PageError message={error} onRetry={retry} />;
  }

  if (loading || !data) {
    return <PageLoading />;
  }

  const { config, schedules } = data;

  return (
    <div className="page-container">
      <h1 className="section-title">婚礼详情</h1>

      <Card className="mb-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">婚礼日期</p>
            <p className="font-medium">{formatWeddingDate(config.wedding_date)}</p>
            <p className="text-sm text-champagne-600">{formatTime(config.wedding_date)}</p>
          </div>
          <div className="border-t border-cream-200 pt-3">
            <p className="text-sm text-gray-500">酒店名称</p>
            <p className="font-medium">{config.venue_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">详细地址</p>
            <p className="text-gray-700">{config.venue_address}</p>
          </div>
        </div>
      </Card>

      <h2 className="font-serif text-lg font-semibold text-champagne-600 mb-4 text-center">
        婚礼流程
      </h2>

      <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-champagne-400/40">
        {schedules.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-champagne-500 bg-white" />
            <Card padding="sm">
              <div className="flex gap-3">
                <span className="shrink-0 font-serif text-champagne-600 font-semibold">
                  {item.time}
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
        {schedules.length === 0 && (
          <p className="text-center text-gray-400 text-sm">暂无流程安排</p>
        )}
      </div>

      {config.dress_code && (
        <Card className="mt-6">
          <h3 className="font-medium text-champagne-600 mb-2">着装建议</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{config.dress_code}</p>
        </Card>
      )}

      {config.notes && (
        <Card className="mt-4">
          <h3 className="font-medium text-champagne-600 mb-2">注意事项</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{config.notes}</p>
        </Card>
      )}
    </div>
  );
}
