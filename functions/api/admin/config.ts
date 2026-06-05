import type { Env } from '../types';
import { isAuthError, requireAuth } from '../utils/auth';
import { getSiteConfig } from '../utils/db';
import { error, handleOptions, json, parseBody } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-me';
  const auth = await requireAuth(request, jwtSecret);
  if (isAuthError(auth)) return auth;

  if (request.method === 'GET') {
    const config = await getSiteConfig(env.DB);
    if (!config) return error('Config not found', 404);
    return json(config);
  }

  if (request.method === 'PUT') {
    const body = await parseBody<Record<string, string>>(request);
    if (!body) return error('Invalid body');

    const allowed = [
      'couple_name', 'groom_name', 'bride_name', 'wedding_date',
      'venue_name', 'venue_address', 'hero_image_url',
      'mv_url', 'mv_cover_url', 'photo_live_url',
      'amap_url', 'baidu_map_url', 'tencent_map_url',
      'dress_code', 'notes', 'mode',
    ] as const;

    const updates: string[] = [];
    const values: string[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (updates.length === 0) return error('No fields to update');

    updates.push("updated_at = datetime('now')");

    await env.DB.prepare(
      `UPDATE site_config SET ${updates.join(', ')} WHERE id = 1`
    )
      .bind(...values)
      .run();

    const config = await getSiteConfig(env.DB);
    return json(config);
  }

  return error('Method not allowed', 405);
};
