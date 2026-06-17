import { Button } from './Button';

interface PageLoadingProps {
  className?: string;
  label?: string;
}

export function PageLoading({
  className = 'page-container flex items-center justify-center min-h-[50vh]',
  label = '加载中...',
}: PageLoadingProps) {
  return (
    <div className={className}>
      <div className="text-champagne-500">{label}</div>
    </div>
  );
}

interface PageErrorProps {
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}

export function PageError({
  message,
  hint = '请检查网络连接，或确认 API 和数据库已正确配置',
  onRetry,
  className = 'page-container flex flex-col items-center justify-center gap-3 min-h-[50vh] px-6 text-center',
}: PageErrorProps) {
  return (
    <div className={className}>
      <div className="text-red-500">{message}</div>
      {hint && <p className="text-sm text-gray-500">{hint}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}

interface PageEmptyProps {
  message: string;
  className?: string;
}

export function PageEmpty({
  message,
  className = 'text-center text-gray-400 py-12',
}: PageEmptyProps) {
  return <div className={className}>{message}</div>;
}
