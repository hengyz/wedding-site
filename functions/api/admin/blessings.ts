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
      'SELECT * FROM blessings ORDER BY created_at DESC'
    ).all();

    return json(results);
  }

  if (request.method === 'POST') {
    const body = await parseBody<{ action?: string }>(request);
    if (body?.action !== 'approve_all_pending') {
      return error('无效的操作');
    }

    const result = await env.DB.prepare(
      "UPDATE blessings SET status = 'approved' WHERE status = 'pending'"
    ).run();

    return json({ updated: result.meta.changes ?? 0 });
  }

  return error('Method not allowed', 405);
};
