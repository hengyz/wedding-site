import type { Env } from '../types';
import { error, handleOptions, json } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return error('Method not allowed', 405);

  const { results } = await context.env.DB.prepare(
    'SELECT id, time, title, description, sort_order FROM schedules WHERE enabled = 1 ORDER BY sort_order ASC, id ASC'
  ).all();

  return json(results);
};
