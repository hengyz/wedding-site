import type { SiteConfig } from '../types';

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
    wedding_date: config.wedding_date,
    venue_name: config.venue_name,
    venue_address: config.venue_address,
    hero_image_url: config.hero_image_url,
    mv_url: config.mv_url,
    mv_cover_url: config.mv_cover_url,
    photo_live_url: config.photo_live_url,
    amap_url: config.amap_url,
    baidu_map_url: config.baidu_map_url,
    tencent_map_url: config.tencent_map_url,
    dress_code: config.dress_code,
    notes: config.notes,
    mode: config.mode,
  };
}
