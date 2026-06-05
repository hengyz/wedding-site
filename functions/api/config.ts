import type { Env } from '../types';
import { getSiteConfig, publicConfig, requireDb, isDbError } from '../utils/db';
import { error, handleOptions, json } from '../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return error('Method not allowed', 405);

  const db = requireDb(context.env);
  if (isDbError(db)) return db;

  const config = await getSiteConfig(db);
  if (!config) return error('Config not found', 404);

  return json(publicConfig(config));
};
