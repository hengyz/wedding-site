export interface SiteConfig {
  couple_name: string;
  groom_name: string;
  bride_name: string;
  couple_display_name?: string;
  wedding_date: string;
  venue_name: string;
  venue_address: string;
  hero_image_url: string;
  mv_url: string;
  mv_cover_url: string;
  photo_live_url: string;
  amap_url: string;
  baidu_map_url: string;
  dress_code: string;
  notes: string;
  mode: 'before_wedding' | 'wedding_day' | 'after_wedding';
}

export interface Schedule {
  id: number;
  time: string;
  title: string;
  description: string;
  sort_order: number;
  enabled?: number;
}

export interface Photo {
  id: number;
  url: string;
  thumbnail_url: string;
  category: string;
  title: string;
  sort_order: number;
  enabled?: number;
}

export interface Blessing {
  id: number;
  name: string;
  content: string;
  status?: string;
  created_at: string;
}

export type {
  RsvpResponse,
  RsvpSubmit,
  RsvpAttendance,
  RsvpTransportType,
} from './rsvp';

import { clearToken } from './auth';
import type { RsvpResponse, RsvpSubmit } from './rsvp';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new ApiError(
      (data as { error?: string }).error || res.statusText,
      res.status
    );
    if (
      res.status === 401 &&
      path.startsWith('/api/admin/') &&
      path !== '/api/admin/login'
    ) {
      clearToken();
    }
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getConfig: () => request<SiteConfig>('/api/config'),

  getSchedules: () => request<Schedule[]>('/api/schedules'),

  getPhotos: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<Photo[]>(`/api/photos${q}`);
  },

  getBlessings: () => request<Blessing[]>('/api/blessings'),

  submitBlessing: (data: { name: string; content: string }) =>
    request<{ id: number; message: string }>('/api/blessings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitRsvp: (data: RsvpSubmit) =>
    request<{ id: string; message: string; updated?: boolean }>('/api/rsvp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminLogin: (password: string) =>
    request<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  adminGetConfig: () =>
    request<SiteConfig & { id: number; updated_at: string }>(
      '/api/admin/config',
      { headers: authHeaders() }
    ),

  adminUpdateConfig: (data: Partial<SiteConfig>) =>
    request<SiteConfig>('/api/admin/config', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  adminUploadHeroImage: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('capturedAt', new Date(file.lastModified).toISOString());

    const res = await fetch('/api/admin/config/hero-upload', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new ApiError(
        (body as { error?: string }).error || res.statusText,
        res.status
      );
      if (res.status === 401) clearToken();
      throw err;
    }

    return res.json() as Promise<{
      url: string;
      hero_image_url: string;
      config: SiteConfig & { id: number; updated_at: string };
    }>;
  },

  adminGetSchedules: () =>
    request<Schedule[]>('/api/admin/schedules', { headers: authHeaders() }),

  adminCreateSchedule: (data: Omit<Schedule, 'id'>) =>
    request<Schedule>('/api/admin/schedules', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  adminUpdateSchedule: (id: number, data: Partial<Schedule>) =>
    request<Schedule>(`/api/admin/schedules/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  adminDeleteSchedule: (id: number) =>
    request<{ success: boolean }>(`/api/admin/schedules/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  adminGetPhotos: () =>
    request<Photo[]>('/api/admin/photos', { headers: authHeaders() }),

  adminCreatePhoto: (data: Omit<Photo, 'id'>) =>
    request<Photo>('/api/admin/photos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  adminUpdatePhoto: (id: number, data: Partial<Photo>) =>
    request<Photo>(`/api/admin/photos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  adminDeletePhoto: (id: number) =>
    request<{ success: boolean }>(`/api/admin/photos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  adminUploadPhoto: async (
    file: File,
    data: { category?: string; title?: string; capturedAt?: string } = {}
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (data.category) form.append('category', data.category);
    if (data.title) form.append('title', data.title);
    form.append('capturedAt', data.capturedAt ?? new Date(file.lastModified).toISOString());

    const res = await fetch('/api/admin/photos/upload', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = new ApiError(
        (body as { error?: string }).error || res.statusText,
        res.status
      );
      if (res.status === 401) clearToken();
      throw err;
    }

    return res.json() as Promise<Photo>;
  },

  adminGetBlessings: () =>
    request<Blessing[]>('/api/admin/blessings', { headers: authHeaders() }),

  adminApproveAllPendingBlessings: () =>
    request<{ updated: number }>('/api/admin/blessings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'approve_all_pending' }),
    }),

  adminUpdateBlessing: (id: number, status: string) =>
    request<Blessing>(`/api/admin/blessings/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  adminGetRsvp: () =>
    request<RsvpResponse[]>('/api/admin/rsvp', { headers: authHeaders() }),

  adminDeleteRsvp: (id: string) =>
    request<{ success: boolean }>(`/api/admin/rsvp/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
};

export const PHOTO_CATEGORIES: Record<string, string> = {
  pre_wedding: '婚纱照',
  certificate: '领证照',
  wedding_day: '婚礼现场',
};

export const SITE_MODES: Record<string, string> = {
  before_wedding: '婚前模式',
  wedding_day: '婚礼当天',
  after_wedding: '婚后家庭',
};
