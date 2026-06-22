import type { Env, Photo } from '../types';
import { requireDb, isDbError } from '../utils/db';
import { resolveDisplayThumbnailUrl } from '../utils/thumbnail';
import { error, handleOptions, json } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return error('Method not allowed', 405);

  const db = requireDb(context.env);
  if (isDbError(db)) return db;

  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');

  let query = 'SELECT id, url, thumbnail_url, category, title, sort_order FROM photos WHERE enabled = 1';
  const params: string[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY sort_order ASC, id ASC';

  const stmt = db.prepare(query);
  const { results } = params.length
    ? await stmt.bind(...params).all<Photo>()
    : await stmt.all<Photo>();

  const r2PublicUrl = context.env.R2_PUBLIC_URL;
  const photos = (results ?? []).map((photo) => ({
    ...photo,
    thumbnail_url: resolveDisplayThumbnailUrl(
      photo.url,
      photo.thumbnail_url,
      r2PublicUrl
    ),
  }));

  return json(photos);
};
