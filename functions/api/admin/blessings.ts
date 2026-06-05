import type { Env } from '../types';
import { isAuthError, requireAuth } from '../utils/auth';
import { error, handleOptions, json } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-me';
  const auth = await requireAuth(request, jwtSecret);
  if (isAuthError(auth)) return auth;

  if (request.method !== 'GET') return error('Method not allowed', 405);

  const { results } = await env.DB.prepare(
    'SELECT * FROM blessings ORDER BY created_at DESC'
  ).all();

  return json(results);
};
