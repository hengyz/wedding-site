import type { Env } from '../../types';
import { signToken, getJwtSecret } from '../../utils/auth';
import { error, handleOptions, json, parseBody } from '../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'POST') return error('Method not allowed', 405);

  const body = await parseBody<{ password?: string }>(context.request);
  if (!body?.password) return error('请输入密码');

  const adminPassword = (context.env.ADMIN_PASSWORD || 'admin123').trim();
  const jwtSecret = getJwtSecret(context.env);

  if (body.password.trim() !== adminPassword) {
    return error('密码错误', 401);
  }

  const token = await signToken(
    {
      sub: 'admin',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    jwtSecret
  );

  return json({ token });
};
