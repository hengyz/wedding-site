import type { Env } from '../types';
import { error, handleOptions, json } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return error('Method not allowed', 405);

  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');

  let query = 'SELECT id, url, thumbnail_url, category, title, sort_order FROM photos WHERE enabled = 1';
  const params: string[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY sort_order ASC, id ASC';

  const stmt = context.env.DB.prepare(query);
  const { results } = params.length
    ? await stmt.bind(...params).all()
    : await stmt.all();

  return json(results);
};
