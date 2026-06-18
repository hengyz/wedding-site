import type { Env } from '../../types';
import { isAuthError, requireAdminAuth } from '../../utils/auth';
import { error, handleOptions, json } from '../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdminAuth(request, env);
  if (isAuthError(auth)) return auth;

  if (request.method !== 'GET') return error('Method not allowed', 405);

  const { results } = await env.DB.prepare(
    'SELECT * FROM rsvp_responses ORDER BY updated_at DESC'
  ).all();

  return json(results);
};
