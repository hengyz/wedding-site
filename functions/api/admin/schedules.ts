import type { Env } from '../../types';
import { isAuthError, requireAuth } from '../../utils/auth';
import { error, handleOptions, json, parseBody } from '../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-me';
  const auth = await requireAuth(request, jwtSecret);
  if (isAuthError(auth)) return auth;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM schedules ORDER BY sort_order ASC, id ASC'
    ).all();
    return json(results);
  }

  if (request.method === 'POST') {
    const body = await parseBody<{
      time?: string;
      title?: string;
      description?: string;
      sort_order?: number;
      enabled?: number;
    }>(request);

    if (!body?.time?.trim() || !body?.title?.trim()) {
      return error('时间和标题不能为空');
    }

    const result = await env.DB.prepare(
      `INSERT INTO schedules (time, title, description, sort_order, enabled)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        body.time.trim(),
        body.title.trim(),
        body.description?.trim() || '',
        body.sort_order ?? 0,
        body.enabled ?? 1
      )
      .run();

    const item = await env.DB.prepare('SELECT * FROM schedules WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return json(item, 201);
  }

  return error('Method not allowed', 405);
};
