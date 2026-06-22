const THUMB_MAX = 480;
const THUMB_QUALITY = 0.82;

export interface GeneratedThumbnail {
  buffer: ArrayBuffer;
  contentType: 'image/webp';
}

/** R2 object key for thumbnail sibling, e.g. wedding/foo.jpg → wedding/foo_thumb.webp */
export function buildThumbnailKey(originalKey: string): string {
  const slash = originalKey.lastIndexOf('/');
  const dir = slash >= 0 ? originalKey.slice(0, slash + 1) : '';
  const filename = slash >= 0 ? originalKey.slice(slash + 1) : originalKey;
  const dot = filename.lastIndexOf('.');
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  return `${dir}${base}_thumb.webp`;
}

/** Cloudflare Image Resizing URL (when R2 custom domain has resizing enabled). */
export function buildCfImageResizeUrl(originalUrl: string, width = THUMB_MAX): string | null {
  try {
    const u = new URL(originalUrl);
    if (u.pathname.includes('/cdn-cgi/image/')) return null;
    return `${u.origin}/cdn-cgi/image/width=${width},format=auto,quality=80${u.pathname}`;
  } catch {
    return null;
  }
}

export function resolveDisplayThumbnailUrl(
  url: string,
  thumbnailUrl: string,
  r2PublicUrl?: string
): string {
  const thumb = thumbnailUrl?.trim();
  if (thumb && thumb !== url) return thumb;

  if (r2PublicUrl) {
    const base = r2PublicUrl.replace(/\/$/, '');
    if (url.startsWith(base)) {
      return buildCfImageResizeUrl(url) ?? url;
    }
  }

  return thumb || url;
}

/** Generate WebP thumbnail via Workers image APIs. Returns null for GIF or on failure. */
export async function generateThumbnail(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<GeneratedThumbnail | null> {
  if (mimeType === 'image/gif') return null;

  try {
    const blob = new Blob([buffer], { type: mimeType });
    const bitmap = await createImageBitmap(blob);

    const scale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const thumbBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: THUMB_QUALITY,
    });

    return {
      buffer: await thumbBlob.arrayBuffer(),
      contentType: 'image/webp',
    };
  } catch {
    return null;
  }
}
