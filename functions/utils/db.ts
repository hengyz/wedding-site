import type { Env, SiteConfig } from '../types';
import { resolveEffectiveMode } from './mode';
import { error } from './response';

export function requireDb(env: Env): D1Database | Response {
  if (!env.DB) {
    return error(
      'Database not bound. Bind D1 as DB in Cloudflare Pages → Settings → Functions.',
      503
    );
  }
  return env.DB;
}

export function isDbError(result: D1Database | Response): result is Response {
  return result instanceof Response;
}

export async function getSiteConfig(db: D1Database): Promise<SiteConfig | null> {
  return db
    .prepare('SELECT * FROM site_config WHERE id = 1')
    .first<SiteConfig>();
}

export function publicConfig(config: SiteConfig) {
  return {
    couple_name: config.couple_name,
    groom_name: config.groom_name,
    bride_name: config.bride_name,
    couple_display_name: config.couple_display_name ?? '',
    wedding_date: config.wedding_date,
    venue_name: config.venue_name,
    venue_address: config.venue_address,
    hero_image_url: config.hero_image_url,
    mv_url: config.mv_url,
    mv_cover_url: config.mv_cover_url,
    photo_live_url: config.photo_live_url,
    amap_url: config.amap_url,
    baidu_map_url: config.baidu_map_url,
    dress_code: config.dress_code,
    notes: config.notes,
    mode: resolveEffectiveMode(config.wedding_date),
  };
}
