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
    const body = await parseBody<{ status?: string }>(request);
    if (!body?.status) return error('status 不能为空');

    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(body.status)) {
      return error('无效的状态');
    }

    await env.DB.prepare('UPDATE blessings SET status = ? WHERE id = ?')
      .bind(body.status, id)
      .run();

    const item = await env.DB.prepare('SELECT * FROM blessings WHERE id = ?')
      .bind(id)
      .first();

    return json(item);
  }

  return error('Method not allowed', 405);
};
