import type { Env } from '../../../types';
import { isAuthError, requireAuth, getJwtSecret } from '../../../utils/auth';
import { error, handleOptions, json } from '../../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const jwtSecret = getJwtSecret(env);
  const auth = await requireAuth(request, jwtSecret);
  if (isAuthError(auth)) return auth;

  const id = params.id;
  if (!id) return error('Missing id');

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM rsvp_responses WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  return error('Method not allowed', 405);
};
