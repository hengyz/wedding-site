import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { usePageLoad } from '../hooks/usePageLoad';
import { PageError, PageLoading } from '../components/PageState';

export function Live() {
  const { data: config, loading, error, retry } = usePageLoad(() => api.getConfig());

  if (error) {
    return <PageError message={error} onRetry={retry} />;
  }

  if (loading || !config) {
    return <PageLoading />;
  }

  return (
    <div className="page-container">
      <h1 className="section-title">照片直播</h1>

      <Card className="text-center py-10">
        <div className="text-5xl mb-4">📡</div>
        <p className="text-gray-600 mb-2">婚礼现场照片实时更新</p>
        <p className="text-sm text-gray-400 mb-8">
          摄影师将在婚礼当天上传现场精彩瞬间
        </p>

        {config.photo_live_url ? (
          <a href={config.photo_live_url} target="_blank" rel="noopener noreferrer">
            <Button size="lg" fullWidth>
              查看现场照片直播
            </Button>
          </a>
        ) : (
          <p className="text-gray-400">直播链接即将公布</p>
        )}
      </Card>
    </div>
  );
}
