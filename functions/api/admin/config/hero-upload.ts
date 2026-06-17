import type { Env } from '../../../types';
import { isAuthError, requireAdminAuth } from '../../../utils/auth';
import { getSiteConfig, requireDb, isDbError } from '../../../utils/db';
import { formatPhotoFilename, resolveCaptureDate } from '../../../utils/photo-date';
import { buildR2Key } from '../../../utils/r2';
import { error, handleOptions, json } from '../../../utils/response';

const MAX_SIZE = 10 * 1024 * 1024;
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

async function buildUniqueHeroKey(
  env: Env,
  baseName: string,
  ext: string
): Promise<string> {
  let candidate = `hero/${baseName}.${ext}`;
  let key = buildR2Key(candidate);
  let suffix = 2;

  while (await env.PHOTOS!.head(key)) {
    candidate = `hero/${baseName}-${suffix}.${ext}`;
    key = buildR2Key(candidate);
    suffix += 1;
  }

  return key;
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

  const ext = extFromType(file.type);
  const capturedAtHint = formData.get('capturedAt')?.toString() || null;
  const buffer = await file.arrayBuffer();
  const captureDate = resolveCaptureDate(buffer, file.type, capturedAtHint);
  const baseName = formatPhotoFilename(captureDate);
  const key = await buildUniqueHeroKey(env, baseName, ext);

  await env.PHOTOS.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  const url = publicUrl(env, key)!;

  await db.prepare(
    `UPDATE site_config SET hero_image_url = ?, updated_at = datetime('now') WHERE id = 1`
  )
    .bind(url)
    .run();

  const config = await getSiteConfig(db);

  return json({ url, hero_image_url: url, config }, 201);
};
