import { SignJWT, jwtVerify } from 'jose';
import type { Env, JWTPayload } from '../types';
import { error } from './response';

export const DEFAULT_ADMIN_PASSWORD = 'admin123';
export const DEFAULT_JWT_SECRET = 'dev-secret-change-me';
const INSECURE_JWT_SECRETS = new Set([
  DEFAULT_JWT_SECRET,
  'dev-secret-change-me-in-production',
]);

export function isDevEnvironment(env: { DEV_MODE?: string }): boolean {
  return env.DEV_MODE === 'true' || env.DEV_MODE === '1';
}

export function resolveAdminPassword(env: Env): string | null {
  const password = env.ADMIN_PASSWORD?.trim();
  if (isDevEnvironment(env)) {
    return password || DEFAULT_ADMIN_PASSWORD;
  }
  if (!password || password === DEFAULT_ADMIN_PASSWORD) {
    return null;
  }
  return password;
}

export function resolveJwtSecret(env: Env): string | null {
  const secret = env.JWT_SECRET?.trim();
  if (isDevEnvironment(env)) {
    return secret || DEFAULT_JWT_SECRET;
  }
  if (!secret || INSECURE_JWT_SECRETS.has(secret)) {
    return null;
  }
  return secret;
}

/** Returns 503 when production secrets are missing or still at defaults. */
export function credentialsMisconfigured(env: Env): Response | null {
  if (isDevEnvironment(env)) return null;
  if (!resolveAdminPassword(env) || !resolveJwtSecret(env)) {
    return error('服务配置未完成，请联系管理员', 503);
  }
  return null;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signToken(secret: string): Promise<string> {
  return new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (!payload.sub || !payload.exp || !payload.iat) return null;
    return {
      sub: String(payload.sub),
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: Request,
  secret: string
): Promise<JWTPayload | Response> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const token = auth.slice(7).trim();
  const payload = await verifyToken(token, secret);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return payload;
}

export async function requireAdminAuth(
  request: Request,
  env: Env
): Promise<JWTPayload | Response> {
  const misconfig = credentialsMisconfigured(env);
  if (misconfig) return misconfig;

  const secret = resolveJwtSecret(env);
  if (!secret) {
    return error('服务配置未完成，请联系管理员', 503);
  }

  return requireAuth(request, secret);
}

export function isAuthError(result: JWTPayload | Response): result is Response {
  return result instanceof Response;
}

/** @deprecated Use resolveJwtSecret */
export function getJwtSecret(env: { JWT_SECRET?: string; DEV_MODE?: string }): string {
  return resolveJwtSecret(env as Env) ?? DEFAULT_JWT_SECRET;
}
