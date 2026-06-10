import type { SiteConfig } from './api';

/** couple_name stores site brand, e.g. 光影世界 */
export function getSiteName(config: Pick<SiteConfig, 'couple_name'>): string {
  return config.couple_name?.trim() || '光影世界';
}

export function getCoupleDisplayName(
  config: Pick<SiteConfig, 'couple_display_name' | 'groom_name' | 'bride_name'>
): string {
  const custom = config.couple_display_name?.trim();
  if (custom) return custom;
  const groom = config.groom_name?.trim() || '新郎';
  const bride = config.bride_name?.trim() || '新娘';
  return `${groom} & ${bride}`;
}

export function getBrandTagline(_config: Pick<SiteConfig, 'couple_name'>): string {
  return 'guangying.wedding';
}

export function getInviteLine(mode: SiteConfig['mode']): string {
  if (mode === 'wedding_day') return '今日我们结婚啦';
  if (mode === 'after_wedding') return '感谢有你';
  return '诚挚邀请您参加我们的婚礼';
}
