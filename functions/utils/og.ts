import type { SiteConfig } from '../types';
import { resolveEffectiveMode } from './mode';

const WEDDING_TIMEZONE = 'Asia/Shanghai';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseWeddingInstant(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const shanghai = new Date(`${normalized}+08:00`);
    if (!isNaN(shanghai.getTime())) return shanghai;
  }

  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

function formatWeddingDate(dateStr: string): string {
  const date = parseWeddingInstant(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('zh-CN', {
    timeZone: WEDDING_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function getCoupleDisplayName(
  config: Pick<SiteConfig, 'couple_display_name' | 'groom_name' | 'bride_name'>
): string {
  const custom = config.couple_display_name?.trim();
  if (custom) return custom;
  const groom = config.groom_name?.trim() || '新郎';
  const bride = config.bride_name?.trim() || '新娘';
  return `${groom} & ${bride}`;
}

function getInviteLine(mode: SiteConfig['mode']): string {
  if (mode === 'wedding_day') return '今日我们结婚啦';
  if (mode === 'after_wedding') return '感谢有你';
  return '诚挚邀请您参加我们的婚礼';
}

function resolveAbsoluteUrl(url: string, origin: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;
  return trimmed;
}

/** Standard Open Graph image ratio (1.91:1). */
const DEFAULT_OG_WIDTH = 1200;
const DEFAULT_OG_HEIGHT = 630;

function guessImageDimensions(imageUrl: string): { width: number; height: number } {
  try {
    const url = new URL(imageUrl);
    const w = url.searchParams.get('w') || url.searchParams.get('width');
    const h = url.searchParams.get('h') || url.searchParams.get('height');
    const width = w ? parseInt(w, 10) : DEFAULT_OG_WIDTH;
    const height = h
      ? parseInt(h, 10)
      : w
        ? Math.round(parseInt(w, 10) / 1.91)
        : DEFAULT_OG_HEIGHT;
    if (width > 0 && height > 0) return { width, height };
  } catch {
    // ignore invalid URL
  }
  return { width: DEFAULT_OG_WIDTH, height: DEFAULT_OG_HEIGHT };
}

function getTwitterSite(siteName: string): string {
  const slug = siteName.replace(/[^a-zA-Z0-9]/g, '');
  return slug ? `@${slug}` : '@guangyingworld';
}

export interface OgMeta {
  title: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  url: string;
  siteName: string;
  twitterSite: string;
}

export function buildOgMeta(config: SiteConfig, pageUrl: string, origin: string): OgMeta {
  const couple = getCoupleDisplayName(config);
  const date = formatWeddingDate(config.wedding_date);
  const invite = getInviteLine(resolveEffectiveMode(config.wedding_date));

  const siteName = config.couple_name?.trim() || '光影世界';
  const image = resolveAbsoluteUrl(
    config.hero_image_url || config.mv_cover_url || '',
    origin
  );
  const { width, height } = guessImageDimensions(image);

  return {
    title: `${couple} 的婚礼`,
    description: date ? `${date} · ${invite}` : invite,
    image,
    imageWidth: width,
    imageHeight: height,
    imageAlt: `${couple} 婚礼邀请封面`,
    url: pageUrl,
    siteName,
    twitterSite: getTwitterSite(siteName),
  };
}

function renderMetaTags(meta: OgMeta): string {
  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta itemprop="name" content="${escapeHtml(meta.title)}" />`,
    `<meta itemprop="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="${escapeHtml(meta.twitterSite)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ];

  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" />`);
    tags.push(`<meta property="og:image:width" content="${meta.imageWidth}" />`);
    tags.push(`<meta property="og:image:height" content="${meta.imageHeight}" />`);
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}" />`);
    tags.push(`<meta itemprop="image" content="${escapeHtml(meta.image)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`);
    tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(meta.imageAlt)}" />`);
  }

  return tags.join('\n    ');
}

export function injectOgIntoHtml(
  html: string,
  config: SiteConfig,
  pageUrl: string,
  origin: string
): string {
  const meta = buildOgMeta(config, pageUrl, origin);
  const ogTags = renderMetaTags(meta);

  let result = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  if (result.includes('<!-- wedding-og -->')) {
    result = result.replace('<!-- wedding-og -->', ogTags);
  } else {
    result = result.replace('</head>', `    ${ogTags}\n  </head>`);
  }

  return result;
}
