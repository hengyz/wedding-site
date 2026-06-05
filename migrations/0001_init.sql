-- Wedding site initial schema

CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  couple_name TEXT NOT NULL DEFAULT '',
  groom_name TEXT NOT NULL DEFAULT '',
  bride_name TEXT NOT NULL DEFAULT '',
  wedding_date TEXT NOT NULL DEFAULT '',
  venue_name TEXT NOT NULL DEFAULT '',
  venue_address TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT NOT NULL DEFAULT '',
  mv_url TEXT NOT NULL DEFAULT '',
  mv_cover_url TEXT NOT NULL DEFAULT '',
  photo_live_url TEXT NOT NULL DEFAULT '',
  amap_url TEXT NOT NULL DEFAULT '',
  baidu_map_url TEXT NOT NULL DEFAULT '',
  tencent_map_url TEXT NOT NULL DEFAULT '',
  dress_code TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'before_wedding' CHECK (mode IN ('before_wedding', 'wedding_day', 'after_wedding')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'pre_wedding',
  title TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blessings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_enabled ON photos(enabled);
CREATE INDEX IF NOT EXISTS idx_blessings_status ON blessings(status);
CREATE INDEX IF NOT EXISTS idx_blessings_ip_created ON blessings(ip, created_at);

-- Seed default config
INSERT INTO site_config (
  id, couple_name, groom_name, bride_name, wedding_date,
  venue_name, venue_address, hero_image_url,
  dress_code, notes, mode
) VALUES (
  1,
  '新郎 & 新娘',
  '新郎',
  '新娘',
  '2026-10-01T12:00:00',
  '幸福大酒店',
  '北京市朝阳区幸福路 88 号',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  '建议穿着正装或礼服，浅色系为佳。',
  '请准时到场，如有特殊饮食需求请提前告知新人。',
  'before_wedding'
);

-- Seed sample schedules
INSERT INTO schedules (time, title, description, sort_order) VALUES
  ('11:30', '宾客签到', '在酒店大堂签到，领取座位卡', 1),
  ('12:00', '婚礼仪式', '主宴会厅举行婚礼仪式', 2),
  ('12:30', '合影留念', '与新人及亲友合影', 3),
  ('13:00', '婚宴午宴', '享用婚宴，期间有互动环节', 4),
  ('15:00', '送客', '感谢各位来宾的光临', 5);

-- Seed sample photos
INSERT INTO photos (url, thumbnail_url, category, title, sort_order) VALUES
  ('https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', 'pre_wedding', '婚纱照 1', 1),
  ('https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80', 'pre_wedding', '婚纱照 2', 2),
  ('https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80', 'travel', '旅行照 1', 3);

-- Seed sample blessings
INSERT INTO blessings (name, content, status) VALUES
  ('张三', '祝你们百年好合，永结同心！', 'approved'),
  ('李四', '新婚快乐，早生贵子！', 'approved');
