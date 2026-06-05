import { useEffect, useState } from 'react';
import { api, PHOTO_CATEGORIES, type Photo } from '../lib/api';
import { ImagePreview } from '../components/ImagePreview';

export function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<string>('');
  const [preview, setPreview] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getPhotos(category || undefined)
      .then(setPhotos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

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

      {loading ? (
        <div className="text-center text-champagne-500 py-12">加载中...</div>
      ) : photos.length === 0 ? (
        <div className="text-center text-gray-400 py-12">暂无照片</div>
      ) : (
        <div className="columns-2 gap-3 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl shadow-sm"
              onClick={() => setPreview(photo)}
            >
              <img
                src={photo.thumbnail_url || photo.url}
                alt={photo.title}
                loading="lazy"
                className="w-full object-cover transition hover:scale-105"
              />
              {photo.title && (
                <p className="bg-white/90 px-2 py-1 text-xs text-gray-600 truncate">
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
