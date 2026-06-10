import type { Env } from './types';
import { getSiteConfig } from './utils/db';
import { injectOgIntoHtml } from './utils/og';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return context.next();
  }

  const response = await context.next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') || !response.ok) {
    return response;
  }

  if (!env.DB) {
    return response;
  }

  try {
    const config = await getSiteConfig(env.DB);
    if (!config) {
      return response;
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const pageUrl = `${origin}${url.pathname === '/' ? '/' : url.pathname}`;
    const html = injectOgIntoHtml(await response.text(), config, pageUrl, origin);

    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=300');
    headers.delete('content-length');

    return new Response(html, { status: response.status, headers });
  } catch {
    return response;
  }
};
