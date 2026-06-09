import type { Env } from '../../../types';
import { isAuthError, requireAuth, getJwtSecret } from '../../../utils/auth';
import { requireDb, isDbError } from '../../../utils/db';
import { buildR2Key } from '../../../utils/r2';
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

  const jwtSecret = getJwtSecret(env);
  const auth = await requireAuth(request, jwtSecret);
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
  const title = (formData.get('title')?.toString() || file.name.replace(/\.[^.]+$/, '')).trim();
  const ext = extFromType(file.type);
  const key = buildR2Key(`${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`);

  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = publicUrl(env, key)!;

  const count = await db.prepare('SELECT COUNT(*) as c FROM photos')
    .first<{ c: number }>();

  const result = await db.prepare(
    `INSERT INTO photos (url, thumbnail_url, category, title, sort_order, enabled)
     VALUES (?, ?, ?, ?, ?, 1)`
  )
    .bind(url, url, category, title, (count?.c ?? 0) + 1)
    .run();

  const item = await db.prepare('SELECT * FROM photos WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return json(item, 201);
};
