import { useState } from 'react';
import { api, PHOTO_CATEGORIES, type Photo } from '../lib/api';
import { ImagePreview } from '../components/ImagePreview';
import { usePageLoad } from '../hooks/usePageLoad';
import { PageEmpty, PageError, PageLoading } from '../components/PageState';

export function Gallery() {
  const [category, setCategory] = useState<string>('');
  const [preview, setPreview] = useState<Photo | null>(null);
  const { data: photos, loading, error, retry } = usePageLoad(
    () => api.getPhotos(category || undefined),
    [category]
  );

  const categories = ['', ...Object.keys(PHOTO_CATEGORIES)];

  return (
    <div className="page-container">
      <h1 className="section-title">我们的相册</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat || 'all'}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
              category === cat
                ? 'bg-champagne-500 text-white'
                : 'bg-white text-gray-600 border border-cream-200'
            }`}
          >
            {cat ? PHOTO_CATEGORIES[cat] : '全部'}
          </button>
        ))}
      </div>

      {error ? (
        <PageError message={error} onRetry={retry} className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center" />
      ) : loading ? (
        <PageLoading className="text-center text-champagne-500 py-12" label="加载中..." />
      ) : !photos || photos.length === 0 ? (
        <PageEmpty message="暂无照片" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="cursor-pointer overflow-hidden rounded-xl shadow-sm bg-white"
              onClick={() => setPreview(photo)}
            >
              <div className="aspect-square w-full overflow-hidden bg-cream-100">
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition hover:scale-105"
                />
              </div>
              {photo.title && (
                <p className="px-2 py-1.5 text-xs text-gray-600 truncate">
                  {photo.title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <ImagePreview
        src={preview?.url || ''}
        alt={preview?.title}
        open={!!preview}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
