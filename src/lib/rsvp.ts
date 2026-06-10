export type RsvpAttendance = 'yes' | 'no' | 'maybe';
export type RsvpTransportType =
  | 'self_drive'
  | 'need_pickup'
  | 'taxi'
  | 'public_transport'
  | 'other';

export interface RsvpResponse {
  id: string;
  name: string;
  phone?: string | null;
  attendance: RsvpAttendance;
  adult_count: number;
  child_count: number;
  arrival_time?: string | null;
  departure_time?: string | null;
  transport_type?: RsvpTransportType | null;
  pickup_location?: string | null;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RsvpSubmit {
  name: string;
  phone?: string;
  attendance: RsvpAttendance;
  adultCount?: number;
  childCount?: number;
  arrivalTime?: string;
  departureTime?: string;
  transportType?: RsvpTransportType;
  pickupLocation?: string;
  remark?: string;
}

export const RSVP_ATTENDANCE_OPTIONS: {
  value: RsvpAttendance;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { value: 'yes', label: '参加', icon: '✅', desc: '期待与您共同见证' },
  { value: 'maybe', label: '待定', icon: '🤔', desc: '暂不确定，稍后更新' },
  { value: 'no', label: '无法参加', icon: '💐', desc: '心意已到，感谢祝福' },
];

export const RSVP_TRANSPORT_OPTIONS: {
  value: RsvpTransportType;
  label: string;
}[] = [
  { value: 'self_drive', label: '自驾' },
  { value: 'need_pickup', label: '需要接站' },
  { value: 'taxi', label: '打车' },
  { value: 'public_transport', label: '公共交通' },
  { value: 'other', label: '其他' },
];

export const RSVP_ATTENDANCE_LABELS: Record<RsvpAttendance, string> = {
  yes: '参加',
  no: '无法参加',
  maybe: '待定',
};

export const RSVP_TRANSPORT_LABELS: Record<RsvpTransportType, string> = {
  self_drive: '自驾',
  need_pickup: '需要接站',
  taxi: '打车',
  public_transport: '公共交通',
  other: '其他',
};

export const RSVP_STORAGE_KEY = 'rsvp_submitted';
