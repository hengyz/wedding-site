import type { Env } from '../types';
import { isAuthError, requireAuth } from '../utils/auth';
import { error, handleOptions, json, parseBody } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-me';
  const auth = await requireAuth(request, jwtSecret);
  if (isAuthError(auth)) return auth;

  const id = params.id;
  if (!id) return error('Missing id');

  if (request.method === 'PUT') {
    const body = await parseBody<{
      time?: string;
      title?: string;
      description?: string;
      sort_order?: number;
      enabled?: number;
    }>(request);
    if (!body) return error('Invalid body');

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (body.time !== undefined) { fields.push('time = ?'); values.push(body.time); }
    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }
    if (body.enabled !== undefined) { fields.push('enabled = ?'); values.push(body.enabled); }

    if (fields.length === 0) return error('No fields to update');

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await env.DB.prepare(
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    const item = await env.DB.prepare('SELECT * FROM schedules WHERE id = ?')
      .bind(id)
      .first();

    return json(item);
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM schedules WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  return error('Method not allowed', 405);
};
