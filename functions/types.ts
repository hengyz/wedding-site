export interface Env {
  DB: D1Database;
  PHOTOS?: R2Bucket;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
  R2_PUBLIC_URL?: string;
}

export interface SiteConfig {
  id: number;
  couple_name: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  venue_name: string;
  venue_address: string;
  hero_image_url: string;
  mv_url: string;
  mv_cover_url: string;
  photo_live_url: string;
  amap_url: string;
  baidu_map_url: string;
  tencent_map_url: string;
  dress_code: string;
  notes: string;
  mode: 'before_wedding' | 'wedding_day' | 'after_wedding';
  updated_at: string;
}

export interface Schedule {
  id: number;
  time: string;
  title: string;
  description: string;
  sort_order: number;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  url: string;
  thumbnail_url: string;
  category: string;
  title: string;
  sort_order: number;
  enabled: number;
  created_at: string;
}

export interface Blessing {
  id: number;
  name: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
}
