import type { Env } from '../types';
import { buildR2Key } from './r2';

export function formatPhotoFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function parseExifDateTime(str: string): Date | null {
  const match = str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6])
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function readAsciiDate(
  view: DataView,
  valueOffset: number,
  count: number,
  littleEndian: boolean
): Date | null {
  const offset = count <= 4 ? valueOffset : view.getUint32(valueOffset, littleEndian);
  if (offset + count > view.byteLength) return null;

  const raw = new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + offset, count));
  return parseExifDateTime(raw.trim());
}

function readIfdTagDate(
  view: DataView,
  ifdOffset: number,
  tagId: number,
  littleEndian: boolean
): Date | null {
  if (ifdOffset + 2 > view.byteLength) return null;

  const tagCount = view.getUint16(ifdOffset, littleEndian);
  for (let i = 0; i < tagCount; i += 1) {
    const entry = ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;

    if (view.getUint16(entry, littleEndian) !== tagId) continue;
    if (view.getUint16(entry + 2, littleEndian) !== 2) return null;

    const count = view.getUint32(entry + 4, littleEndian);
    return readAsciiDate(view, entry + 8, count, littleEndian);
  }

  return null;
}

function readExifDateFromTiff(view: DataView): Date | null {
  if (view.byteLength < 8) return null;

  const byteOrder = view.getUint16(0);
  const littleEndian = byteOrder === 0x4949;
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return null;

  const ifd0 = view.getUint32(4, littleEndian);
  if (ifd0 + 2 > view.byteLength) return null;

  let exifIfdOffset = 0;
  const tagCount = view.getUint16(ifd0, littleEndian);

  for (let i = 0; i < tagCount; i += 1) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;

    const tag = view.getUint16(entry, littleEndian);
    const type = view.getUint16(entry + 2, littleEndian);
    if (tag !== 0x8769 || type !== 4) continue;

    exifIfdOffset = view.getUint32(entry + 8, littleEndian);
    break;
  }

  if (exifIfdOffset) {
    const original = readIfdTagDate(view, exifIfdOffset, 0x9003, littleEndian);
    if (original) return original;
  }

  return readIfdTagDate(view, ifd0, 0x0132, littleEndian);
}

export function extractJpegCaptureDate(buffer: ArrayBuffer): Date | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;

    const marker = view.getUint8(offset + 1);
    if (marker === 0xd8 || marker === 0xd9) break;

    const segmentLength = view.getUint16(offset + 2);
    if (segmentLength < 2 || offset + 2 + segmentLength > view.byteLength) break;

    if (marker === 0xe1 && segmentLength >= 8) {
      const header = new TextDecoder().decode(
        new Uint8Array(buffer, offset + 4, Math.min(6, segmentLength - 2))
      );
      if (header === 'Exif\x00\x00') {
        const tiffOffset = offset + 10;
        const tiffLength = segmentLength - 8;
        if (tiffOffset + tiffLength <= view.byteLength) {
          const date = readExifDateFromTiff(new DataView(buffer, tiffOffset, tiffLength));
          if (date) return date;
        }
      }
    }

    offset += 2 + segmentLength;
  }

  return null;
}

export function resolveCaptureDate(
  buffer: ArrayBuffer,
  mimeType: string,
  fallbackIso?: string | null
): Date {
  if (mimeType === 'image/jpeg') {
    const exifDate = extractJpegCaptureDate(buffer);
    if (exifDate) return exifDate;
  }

  if (fallbackIso) {
    const parsed = new Date(fallbackIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

export async function buildUniquePhotoKey(
  env: Env,
  baseName: string,
  ext: string
): Promise<string> {
  let candidate = `${baseName}.${ext}`;
  let key = buildR2Key(candidate);
  let suffix = 2;

  while (await env.PHOTOS!.head(key)) {
    candidate = `${baseName}-${suffix}.${ext}`;
    key = buildR2Key(candidate);
    suffix += 1;
  }

  return key;
}
