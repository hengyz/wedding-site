import type { Env } from '../../types';
import { isAuthError, requireAdminAuth } from '../../utils/auth';
import { error, handleOptions, json, parseBody } from '../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdminAuth(request, env);
  if (isAuthError(auth)) return auth;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM photos ORDER BY sort_order ASC, id ASC'
    ).all();
    return json(results);
  }

  if (request.method === 'POST') {
    const body = await parseBody<{
      url?: string;
      thumbnail_url?: string;
      category?: string;
      title?: string;
      sort_order?: number;
      enabled?: number;
    }>(request);

    if (!body?.url?.trim()) return error('图片 URL 不能为空');

    const result = await env.DB.prepare(
      `INSERT INTO photos (url, thumbnail_url, category, title, sort_order, enabled)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.url.trim(),
        body.thumbnail_url?.trim() || body.url.trim(),
        body.category?.trim() || 'pre_wedding',
        body.title?.trim() || '',
        body.sort_order ?? 0,
        body.enabled ?? 1
      )
      .run();

    const item = await env.DB.prepare('SELECT * FROM photos WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return json(item, 201);
  }

  return error('Method not allowed', 405);
};
