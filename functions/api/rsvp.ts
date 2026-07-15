import type { Env } from '../types';
import { hashIp } from '../utils/hash';
import { requireDb, isDbError } from '../utils/db';
import {
  error,
  getClientIp,
  handleOptions,
  json,
  parseBody,
} from '../utils/response';

type Attendance = 'yes' | 'no' | 'maybe';
type TransportType = 'self_drive' | 'need_pickup' | 'taxi' | 'public_transport' | 'other';

interface RsvpRequest {
  name?: string;
  phone?: string;
  attendance?: Attendance;
  adultCount?: number;
  childCount?: number;
  arrivalTime?: string;
  departureTime?: string;
  transportType?: TransportType;
  pickupLocation?: string;
  remark?: string;
}

const ATTENDANCE_VALUES = new Set<Attendance>(['yes', 'no', 'maybe']);
const TRANSPORT_VALUES = new Set<TransportType>([
  'self_drive',
  'need_pickup',
  'taxi',
  'public_transport',
  'other',
]);

const MAX_NAME = 20;
const MAX_PHONE = 20;
const MAX_REMARK = 200;
const MAX_PICKUP = 100;
const RATE_LIMIT = 5;
const RATE_WINDOW_MINUTES = 1;

function parseCount(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return error('Method not allowed', 405);

  const db = requireDb(env);
  if (isDbError(db)) return db;

  const body = await parseBody<RsvpRequest>(request);
  if (!body) return error('无效的请求数据');

  const name = body.name?.trim() || '';
  if (name.length < 1 || name.length > MAX_NAME) {
    return error(`姓名必填，最多 ${MAX_NAME} 字`);
  }

  const attendance = body.attendance;
  if (!attendance || !ATTENDANCE_VALUES.has(attendance)) {
    return error('请选择是否参加');
  }

  const phone = body.phone?.trim().slice(0, MAX_PHONE) || null;
  const remark = body.remark?.trim().slice(0, MAX_REMARK) || null;

  let adultCount = 0;
  let childCount = 0;
  let arrivalTime: string | null = null;
  let departureTime: string | null = null;
  let transportType: TransportType | null = null;
  let pickupLocation: string | null = null;

  if (attendance === 'yes' || attendance === 'maybe') {
    const parsedAdults = parseCount(body.adultCount, 1, 10);
    if (parsedAdults === null) {
      return error(
        body.adultCount === undefined || body.adultCount === null
          ? '请填写成人数'
          : '成人数需在 1-10 之间'
      );
    }
    adultCount = parsedAdults;

    const parsedChildren =
      body.childCount === undefined || body.childCount === null
        ? 0
        : parseCount(body.childCount, 0, 10);
    if (parsedChildren === null) {
      return error('儿童数需在 0-10 之间');
    }
    childCount = parsedChildren;

    arrivalTime = body.arrivalTime?.trim() || null;
    departureTime = body.departureTime?.trim() || null;

    if (body.transportType) {
      if (!TRANSPORT_VALUES.has(body.transportType)) {
        return error('无效的交通方式');
      }
      transportType = body.transportType;
    }

    if (transportType === 'need_pickup') {
      pickupLocation = body.pickupLocation?.trim().slice(0, MAX_PICKUP) || null;
      if (!pickupLocation) {
        return error('请填写接站地点');
      }
    } else if (body.pickupLocation?.trim()) {
      pickupLocation = body.pickupLocation.trim().slice(0, MAX_PICKUP);
    }
  }

  const ip = getClientIp(request);
  const salt = env.JWT_SECRET || 'rsvp-salt';
  const ipHash = await hashIp(ip, salt);
  const userAgent = request.headers.get('User-Agent') || '';

  const recent = await db.prepare(
    `SELECT COUNT(*) as c FROM rsvp_responses
     WHERE ip_hash = ? AND created_at > datetime('now', '-${RATE_WINDOW_MINUTES} minute')`
  )
    .bind(ipHash)
    .first<{ c: number }>();

  if ((recent?.c ?? 0) >= RATE_LIMIT) {
    return error('提交过于频繁，请稍后再试', 429);
  }

  const now = new Date().toISOString();

  const existing = await db.prepare(
    'SELECT id FROM rsvp_responses WHERE name = ? LIMIT 1'
  )
    .bind(name)
    .first<{ id: string }>();

  if (existing) {
    await db.prepare(
      `UPDATE rsvp_responses SET
        phone = ?, attendance = ?, adult_count = ?, child_count = ?,
        arrival_time = ?, departure_time = ?, transport_type = ?,
        pickup_location = ?, remark = ?, ip_hash = ?, user_agent = ?,
        updated_at = ?
      WHERE id = ?`
    )
      .bind(
        phone,
        attendance,
        adultCount,
        childCount,
        arrivalTime,
        departureTime,
        transportType,
        pickupLocation,
        remark,
        ipHash,
        userAgent,
        now,
        existing.id
      )
      .run();

    return json(
      {
        id: existing.id,
        updated: true,
        message: '您的回执已更新，我们已收到最新信息。',
      },
      200
    );
  }

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO rsvp_responses (
      id, name, phone, attendance, adult_count, child_count,
      arrival_time, departure_time, transport_type, pickup_location, remark,
      ip_hash, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      name,
      phone,
      attendance,
      adultCount,
      childCount,
      arrivalTime,
      departureTime,
      transportType,
      pickupLocation,
      remark,
      ipHash,
      userAgent,
      now,
      now
    )
    .run();

  return json(
    {
      id,
      updated: false,
      message: '感谢您的回执，我们已收到您的信息。',
    },
    201
  );
};
