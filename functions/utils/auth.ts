import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '../types';

export function getJwtSecret(env: { JWT_SECRET?: string }): string {
  return (env.JWT_SECRET || 'dev-secret-change-me').trim();
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

export function isAuthError(result: JWTPayload | Response): result is Response {
  return result instanceof Response;
}
