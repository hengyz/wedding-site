import type { Env } from '../../../types';
import { isAuthError, requireAdminAuth } from '../../../utils/auth';
import { requireDb, isDbError } from '../../../utils/db';
import {
  buildUniquePhotoKey,
  formatPhotoFilename,
  resolveCaptureDate,
} from '../../../utils/photo-date';
import {
  buildThumbnailKey,
  generateThumbnail,
} from '../../../utils/thumbnail';
import { error, handleOptions, json } from '../../../utils/response';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function extFromType(type: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[type] || 'jpg';
}

function publicUrl(env: Env, key: string): string | null {
  if (!env.R2_PUBLIC_URL) return null;
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdminAuth(request, env);
  if (isAuthError(auth)) return auth;

  if (request.method !== 'POST') return error('Method not allowed', 405);

  if (!env.PHOTOS) {
    return error('R2 未绑定，请在 Pages Functions 中绑定 PHOTOS', 503);
  }

  if (!env.R2_PUBLIC_URL) {
    return error('请先在环境变量中配置 R2_PUBLIC_URL（如 https://photos.guangying.world）', 503);
  }

  const db = requireDb(env);
  if (isDbError(db)) return db;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error('无效的上传数据');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return error('请选择图片文件');
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return error('仅支持 JPG、PNG、WebP、GIF 格式');
  }

  if (file.size > MAX_SIZE) {
    return error('图片大小不能超过 10MB');
  }

  const category = (formData.get('category')?.toString() || 'pre_wedding').trim();
  const ext = extFromType(file.type);
  const capturedAtHint = formData.get('capturedAt')?.toString() || null;

  const buffer = await file.arrayBuffer();
  const captureDate = resolveCaptureDate(buffer, file.type, capturedAtHint);
  const baseName = formatPhotoFilename(captureDate);
  const key = await buildUniquePhotoKey(env, baseName, ext);

  const defaultTitle = baseName.replace(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
    '$1-$2-$3 $4:$5:$6'
  );
  const title = (formData.get('title')?.toString() || defaultTitle).trim();

  await env.PHOTOS.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  const url = publicUrl(env, key)!;
  let thumbnailUrl = url;

  const thumb = await generateThumbnail(buffer, file.type);
  if (thumb) {
    const thumbKey = buildThumbnailKey(key);
    await env.PHOTOS.put(thumbKey, thumb.buffer, {
      httpMetadata: { contentType: thumb.contentType },
    });
    thumbnailUrl = publicUrl(env, thumbKey)!;
  }

  const count = await db.prepare('SELECT COUNT(*) as c FROM photos')
    .first<{ c: number }>();

  const result = await db.prepare(
    `INSERT INTO photos (url, thumbnail_url, category, title, sort_order, enabled)
     VALUES (?, ?, ?, ?, ?, 1)`
  )
    .bind(url, thumbnailUrl, category, title, (count?.c ?? 0) + 1)
    .run();

  const item = await db.prepare('SELECT * FROM photos WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return json(item, 201);
};
