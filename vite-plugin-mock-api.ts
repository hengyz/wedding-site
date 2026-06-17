import type { Plugin } from 'vite';
import { resolveEffectiveMode } from './src/lib/mode';

const seedConfig = {
  id: 1,
  couple_name: '光影世界',
  groom_name: '新郎',
  bride_name: '新娘',
  couple_display_name: '新郎 & 新娘',
  wedding_date: '2026-10-01T04:00:00.000Z', // 北京时间 2026-10-01 12:00
  venue_name: '幸福大酒店',
  venue_address: '北京市朝阳区幸福路 88 号',
  hero_image_url:
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  mv_url: '',
  mv_cover_url: '',
  photo_live_url: '',
  amap_url: '',
  baidu_map_url: '',
  tencent_map_url: '',
  dress_code: '建议穿着正装或礼服，浅色系为佳。',
  notes: '请准时到场，如有特殊饮食需求请提前告知新人。',
  mode: 'before_wedding' as const,
  updated_at: new Date().toISOString(),
};

const seedSchedules = [
  { id: 1, time: '11:30', title: '宾客签到', description: '在酒店大堂签到，领取座位卡', sort_order: 1, enabled: 1 },
  { id: 2, time: '12:00', title: '婚礼仪式', description: '主宴会厅举行婚礼仪式', sort_order: 2, enabled: 1 },
  { id: 3, time: '12:30', title: '合影留念', description: '与新人及亲友合影', sort_order: 3, enabled: 1 },
  { id: 4, time: '13:00', title: '婚宴午宴', description: '享用婚宴，期间有互动环节', sort_order: 4, enabled: 1 },
  { id: 5, time: '15:00', title: '送客', description: '感谢各位来宾的光临', sort_order: 5, enabled: 1 },
];

const seedPhotos = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    category: 'pre_wedding',
    title: '婚纱照 1',
    sort_order: 1,
    enabled: 1,
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80',
    category: 'pre_wedding',
    title: '婚纱照 2',
    sort_order: 2,
    enabled: 1,
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
    category: 'travel',
    title: '旅行照 1',
    sort_order: 3,
    enabled: 1,
  },
];

let blessings = [
  { id: 1, name: '张三', content: '祝你们百年好合，永结同心！', status: 'approved', created_at: new Date().toISOString() },
  { id: 2, name: '李四', content: '新婚快乐，早生贵子！', status: 'approved', created_at: new Date().toISOString() },
];

type MockRsvp = {
  id: string;
  name: string;
  phone: string | null;
  attendance: 'yes' | 'no' | 'maybe';
  adult_count: number;
  child_count: number;
  arrival_time: string | null;
  departure_time: string | null;
  transport_type: string | null;
  pickup_location: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
};

let rsvpResponses: MockRsvp[] = [
  {
    id: 'mock-1',
    name: '王五',
    phone: '13800138000',
    attendance: 'yes',
    adult_count: 2,
    child_count: 1,
    arrival_time: '2026-10-06T10:30',
    departure_time: null,
    transport_type: 'need_pickup',
    pickup_location: '高铁站',
    remark: '有一位老人',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let nextBlessingId = 3;
let nextScheduleId = 6;
let nextPhotoId = 4;

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function publicConfig() {
  const { id: _id, updated_at: _u, mode: _m, ...rest } = seedConfig;
  return {
    ...rest,
    mode: resolveEffectiveMode(seedConfig.wedding_date),
  };
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) return next();

        const url = new URL(req.url, 'http://localhost');
        const path = url.pathname;
        const method = req.method || 'GET';

        const send = (body: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        try {
          if (path === '/api/config' && method === 'GET') {
            return send(publicConfig());
          }

          if (path === '/api/schedules' && method === 'GET') {
            return send(seedSchedules.filter((s) => s.enabled));
          }

          if (path === '/api/photos' && method === 'GET') {
            const cat = url.searchParams.get('category');
            const list = seedPhotos.filter((p) => p.enabled && (!cat || p.category === cat));
            return send(list);
          }

          if (path === '/api/blessings') {
            if (method === 'GET') {
              return send(blessings.filter((b) => b.status === 'approved'));
            }
            if (method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                const data = JSON.parse(body || '{}');
                const item = {
                  id: nextBlessingId++,
                  name: data.name,
                  content: data.content,
                  status: 'pending',
                  created_at: new Date().toISOString(),
                };
                blessings.unshift(item);
                send({ id: item.id, message: '提交成功，审核通过后将展示（Mock 模式）' }, 201);
              });
              return;
            }
          }

          if (path === '/api/rsvp' && method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              const data = JSON.parse(body || '{}');
              const now = new Date().toISOString();
              const showDetails = data.attendance === 'yes' || data.attendance === 'maybe';
              const item: MockRsvp = {
                id: crypto.randomUUID(),
                name: data.name,
                phone: data.phone || null,
                attendance: data.attendance,
                adult_count: showDetails ? (data.adultCount ?? 1) : 0,
                child_count: showDetails ? (data.childCount ?? 0) : 0,
                arrival_time: showDetails ? (data.arrivalTime || null) : null,
                departure_time: showDetails ? (data.departureTime || null) : null,
                transport_type: showDetails ? (data.transportType || null) : null,
                pickup_location: data.pickupLocation || null,
                remark: data.remark || null,
                created_at: now,
                updated_at: now,
              };
              rsvpResponses.unshift(item);
              send({ id: item.id, message: '感谢您的回执，我们已收到您的信息。' }, 201);
            });
            return;
          }

          if (path === '/api/admin/login' && method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              const data = JSON.parse(body || '{}');
              if (data.password === 'admin123') {
                send({ token: 'mock-dev-token' });
              } else {
                send({ error: '密码错误' }, 401);
              }
            });
            return;
          }

          const isAdmin = req.headers.authorization === 'Bearer mock-dev-token';

          if (path === '/api/admin/config') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            if (method === 'GET') return send(seedConfig);
            if (method === 'PUT') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                Object.assign(seedConfig, JSON.parse(body || '{}'));
                seedConfig.updated_at = new Date().toISOString();
                send(seedConfig);
              });
              return;
            }
          }

          if (path === '/api/admin/config/hero-upload' && method === 'POST') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            const url =
              'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80';
            seedConfig.hero_image_url = url;
            seedConfig.updated_at = new Date().toISOString();
            send({ url, hero_image_url: url, config: seedConfig }, 201);
            return;
          }

          if (path === '/api/admin/schedules') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            if (method === 'GET') return send(seedSchedules);
            if (method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                const data = JSON.parse(body || '{}');
                const item = { id: nextScheduleId++, ...data, enabled: data.enabled ?? 1 };
                seedSchedules.push(item);
                send(item, 201);
              });
              return;
            }
          }

          const scheduleMatch = path.match(/^\/api\/admin\/schedules\/(\d+)$/);
          if (scheduleMatch && isAdmin) {
            const id = Number(scheduleMatch[1]);
            const idx = seedSchedules.findIndex((s) => s.id === id);
            if (method === 'PUT') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                if (idx >= 0) Object.assign(seedSchedules[idx], JSON.parse(body || '{}'));
                send(seedSchedules[idx] || {});
              });
              return;
            }
            if (method === 'DELETE') {
              if (idx >= 0) seedSchedules.splice(idx, 1);
              return send({ success: true });
            }
          }

          if (path === '/api/admin/photos/upload' && method === 'POST') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            send({
              id: nextPhotoId++,
              url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
              thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
              category: 'pre_wedding',
              title: 'Mock 上传',
              sort_order: seedPhotos.length + 1,
              enabled: 1,
            }, 201);
            return;
          }

          if (path === '/api/admin/photos') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            if (method === 'GET') return send(seedPhotos);
            if (method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                const data = JSON.parse(body || '{}');
                const item = {
                  id: nextPhotoId++,
                  ...data,
                  thumbnail_url: data.thumbnail_url || data.url,
                  enabled: data.enabled ?? 1,
                };
                seedPhotos.push(item);
                send(item, 201);
              });
              return;
            }
          }

          const photoMatch = path.match(/^\/api\/admin\/photos\/(\d+)$/);
          if (photoMatch && isAdmin) {
            const id = Number(photoMatch[1]);
            const idx = seedPhotos.findIndex((p) => p.id === id);
            if (method === 'PUT') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                if (idx >= 0) Object.assign(seedPhotos[idx], JSON.parse(body || '{}'));
                send(seedPhotos[idx] || {});
              });
              return;
            }
            if (method === 'DELETE') {
              if (idx >= 0) seedPhotos.splice(idx, 1);
              return send({ success: true });
            }
          }

          if (path === '/api/admin/blessings' && method === 'GET') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            return send(blessings);
          }

          const blessingMatch = path.match(/^\/api\/admin\/blessings\/(\d+)$/);
          if (blessingMatch && isAdmin && method === 'PUT') {
            const id = Number(blessingMatch[1]);
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              const data = JSON.parse(body || '{}');
              const item = blessings.find((b) => b.id === id);
              if (item) item.status = data.status;
              send(item || {});
            });
            return;
          }

          if (path === '/api/admin/rsvp' && method === 'GET') {
            if (!isAdmin) return send({ error: 'Unauthorized' }, 401);
            return send(rsvpResponses);
          }

          const rsvpMatch = path.match(/^\/api\/admin\/rsvp\/([^/]+)$/);
          if (rsvpMatch && isAdmin && method === 'DELETE') {
            const id = rsvpMatch[1];
            rsvpResponses = rsvpResponses.filter((r) => r.id !== id);
            return send({ success: true });
          }

          send({ error: 'Not found' }, 404);
        } catch (e) {
          send({ error: String(e) }, 500);
        }
      });
    },
  };
}
