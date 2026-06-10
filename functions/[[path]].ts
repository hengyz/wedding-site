import type { Env } from './types';
import { getSiteConfig } from './utils/db';
import { injectOgIntoHtml } from './utils/og';

function shouldServeAsset(pathname: string): boolean {
  if (pathname === '/favicon.svg' || pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/assets/')) return true;
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  if (shouldServeAsset(url.pathname) || url.pathname.startsWith('/api/')) {
    return env.ASSETS.fetch(request);
  }

  const indexRequest = new Request(new URL('/index.html', url.origin), request);
  const assetResponse = await env.ASSETS.fetch(indexRequest);
  if (!assetResponse.ok) {
    return assetResponse;
  }

  const origin = url.origin;
  const pageUrl = `${origin}${url.pathname === '/' ? '/' : url.pathname}`;

  let html = await assetResponse.text();

  if (env.DB) {
    try {
      const config = await getSiteConfig(env.DB);
      if (config) {
        html = injectOgIntoHtml(html, config, pageUrl, origin);
      }
    } catch {
      // Fall back to static index.html without dynamic OG tags.
    }
  }

  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Type', 'text/html;charset=UTF-8');
  headers.set('Cache-Control', 'public, max-age=300');

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  return new Response(html, { status: 200, headers });
};
