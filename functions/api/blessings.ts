import type { Env } from '../types';
import { requireDb, isDbError } from '../utils/db';
import {
  error,
  getClientIp,
  handleOptions,
  json,
  parseBody,
} from '../utils/response';

const RATE_LIMIT_MINUTES = 5;
const MAX_NAME_LEN = 20;
const MAX_CONTENT_LEN = 200;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return handleOptions();

  const db = requireDb(env);
  if (isDbError(db)) return db;

  if (request.method === 'GET') {
    const { results } = await db.prepare(
      "SELECT id, name, content, created_at FROM blessings WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json(results);
  }

  if (request.method === 'POST') {
    const body = await parseBody<{ name?: string; content?: string }>(request);
    if (!body?.name?.trim() || !body?.content?.trim()) {
      return error('姓名和祝福语不能为空');
    }

    const name = body.name.trim().slice(0, MAX_NAME_LEN);
    const content = body.content.trim().slice(0, MAX_CONTENT_LEN);
    const ip = getClientIp(request);
    const userAgent = request.headers.get('User-Agent') || '';

    const recent = await db.prepare(
      `SELECT id FROM blessings
       WHERE ip = ? AND created_at > datetime('now', '-${RATE_LIMIT_MINUTES} minutes')
       LIMIT 1`
    )
      .bind(ip)
      .first();

    if (recent) {
      return error(`请 ${RATE_LIMIT_MINUTES} 分钟后再提交`, 429);
    }

    const result = await db.prepare(
      'INSERT INTO blessings (name, content, status, ip, user_agent) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(name, content, 'pending', ip, userAgent)
      .run();

    return json(
      { id: result.meta.last_row_id, message: '提交成功，审核通过后将展示' },
      201
    );
  }

  return error('Method not allowed', 405);
};
