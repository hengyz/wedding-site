import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';

export function usePageLoad<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return loader()
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof ApiError ? err.message : '加载失败，请稍后重试'
        );
        setData(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}
