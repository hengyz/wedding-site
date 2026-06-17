import type { Env } from '../../types';
import {
  credentialsMisconfigured,
  resolveAdminPassword,
  resolveJwtSecret,
  signToken,
} from '../../utils/auth';
import { requireDb, isDbError } from '../../utils/db';
import {
  isLoginRateLimited,
  recordLoginAttempt,
} from '../../utils/login-rate-limit';
import {
  error,
  getClientIp,
  handleOptions,
  json,
  parseBody,
} from '../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'POST') return error('Method not allowed', 405);

  const misconfig = credentialsMisconfigured(context.env);
  if (misconfig) return misconfig;

  const body = await parseBody<{ password?: string }>(context.request);
  if (!body?.password) return error('请输入密码');

  const ip = getClientIp(context.request);
  const db = requireDb(context.env);
  if (!isDbError(db)) {
    if (await isLoginRateLimited(db, ip)) {
      return error('登录尝试过多，请 15 分钟后再试', 429);
    }
  }

  const adminPassword = resolveAdminPassword(context.env)!;
  const jwtSecret = resolveJwtSecret(context.env)!;

  if (body.password.trim() !== adminPassword) {
    if (!isDbError(db)) {
      await recordLoginAttempt(db, ip, false);
    }
    return error('密码错误', 401);
  }

  if (!isDbError(db)) {
    await recordLoginAttempt(db, ip, true);
  }

  const token = await signToken(jwtSecret);
  return json({ token });
};
