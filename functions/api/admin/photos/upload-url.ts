import type { Env } from '../../../types';
import { isAuthError, requireAdminAuth } from '../../../utils/auth';
import { buildR2Key } from '../../../utils/r2';
import { error, handleOptions, json, parseBody } from '../../../utils/response';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdminAuth(request, env);
  if (isAuthError(auth)) return auth;

  if (request.method !== 'POST') return error('Method not allowed', 405);

  const body = await parseBody<{
    filename?: string;
    contentType?: string;
  }>(request);

  if (!body?.filename?.trim()) return error('filename 不能为空');

  const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = buildR2Key(`${Date.now()}-${safeName}`);
  const contentType = body.contentType || 'image/jpeg';

  if (!env.PHOTOS) {
    return json({
      key,
      uploadUrl: null,
      publicUrl: env.R2_PUBLIC_URL
        ? `${env.R2_PUBLIC_URL}/${key}`
        : null,
      message: 'R2 未绑定，请手动填写图片 URL 或使用 R2 公共域名',
    });
  }

  // R2 presigned URL via Workers binding - use direct upload through admin API instead
  // For MVP: return the key and public URL pattern for manual upload via dashboard
  const publicUrl = env.R2_PUBLIC_URL
    ? `${env.R2_PUBLIC_URL}/${key}`
    : `https://your-r2-domain/${key}`;

  return json({
    key,
    publicUrl,
    contentType,
    message: '请通过 Cloudflare Dashboard 或 wrangler r2 上传文件，然后使用 publicUrl 保存照片记录',
  });
};
