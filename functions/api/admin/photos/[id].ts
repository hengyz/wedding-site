import type { Env } from '../../../types';
import { isAuthError, requireAdminAuth } from '../../../utils/auth';
import { error, handleOptions, json, parseBody } from '../../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdminAuth(request, env);
  if (isAuthError(auth)) return auth;

  const id = params.id;
  if (!id) return error('Missing id');

  if (request.method === 'PUT') {
    const body = await parseBody<{
      url?: string;
      thumbnail_url?: string;
      category?: string;
      title?: string;
      sort_order?: number;
      enabled?: number;
    }>(request);
    if (!body) return error('Invalid body');

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (body.url !== undefined) { fields.push('url = ?'); values.push(body.url); }
    if (body.thumbnail_url !== undefined) { fields.push('thumbnail_url = ?'); values.push(body.thumbnail_url); }
    if (body.category !== undefined) { fields.push('category = ?'); values.push(body.category); }
    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }
    if (body.enabled !== undefined) { fields.push('enabled = ?'); values.push(body.enabled); }

    if (fields.length === 0) return error('No fields to update');

    values.push(id);

    await env.DB.prepare(
      `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    const item = await env.DB.prepare('SELECT * FROM photos WHERE id = ?')
      .bind(id)
      .first();

    return json(item);
  }

  if (request.method === 'DELETE') {
    const photo = await env.DB.prepare('SELECT url FROM photos WHERE id = ?')
      .bind(id)
      .first<{ url: string }>();

    if (photo && env.PHOTOS) {
      try {
        const key = new URL(photo.url).pathname.slice(1);
        if (key) await env.PHOTOS.delete(key);
      } catch {
        // ignore R2 delete errors for external URLs
      }
    }

    await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  return error('Method not allowed', 405);
};
