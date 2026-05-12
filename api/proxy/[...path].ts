export const config = { runtime: 'edge' };

const TARGETS: Record<string, string> = {
  'nlsc-wfs':       'https://wfs.nlsc.gov.tw/wfs',
  'nlsc-wmts':      'https://wmts.nlsc.gov.tw/wmts',
  'nlsc-wms':       'https://wms.nlsc.gov.tw/wms',
  'nlsc-api':       'https://api.nlsc.gov.tw',
  'cgs-wms':        'https://geomap.gsmma.gov.tw',
  'swcb-wms':       'https://246.ardswc.gov.tw',
  'wra-wms':        'https://maps.wra.gov.tw',
  'soil-wms':       'https://serv.ardswc.gov.tw',
  'moenv-wms':      'https://wsserver.moenv.gov.tw',
  'ncdr-wms':       'https://dmap.ncdr.nat.gov.tw',
  'pvgis':          'https://re.jrc.ec.europa.eu',
  'open-elevation': 'https://api.open-elevation.com',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TILE_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600';

function getSearchParamLower(targetUrl: URL, name: string) {
  for (const [key, value] of targetUrl.searchParams) {
    if (key.toLowerCase() === name) return value.toLowerCase();
  }
  return null;
}

function isTileRequest(routeKey: string, targetUrl: URL) {
  const request = getSearchParamLower(targetUrl, 'request');
  if (request === 'getmap' || request === 'gettile') return true;
  return routeKey === 'nlsc-wmts' && targetUrl.pathname.toLowerCase().includes('/googlemapscompatible/');
}

export default async function handler(request: Request): Promise<Response> {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  // Strip leading /api/proxy/ to get "nlsc-wms/...?..."
  const after = url.pathname.replace(/^\/api\/proxy\/?/, '');
  const slashIdx = after.indexOf('/');
  const routeKey = slashIdx === -1 ? after : after.slice(0, slashIdx);
  const restPath = slashIdx === -1 ? '' : after.slice(slashIdx + 1);

  const baseTarget = TARGETS[routeKey];
  if (!baseTarget) {
    return new Response(`Unknown proxy route: ${routeKey}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS },
    });
  }

  // Build the upstream URL
  const targetUrl = new URL(baseTarget);
  if (restPath) {
    targetUrl.pathname = targetUrl.pathname.replace(/\/$/, '') + '/' + restPath;
  }
  // Forward all query parameters
  url.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

  // Build upstream request headers (strip browser-only headers)
  const upstreamHeaders = new Headers();
  upstreamHeaders.set('User-Agent', 'LandWeaver-AI/1.0');
  const contentType = request.headers.get('Content-Type');
  if (contentType) upstreamHeaders.set('Content-Type', contentType);

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? request.body : undefined,
    });

    // Clone upstream headers, replace any upstream CORS headers with ours
    const respHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!k.toLowerCase().startsWith('access-control')) {
        respHeaders.set(k, v);
      }
    });
    Object.entries(CORS_HEADERS).forEach(([k, v]) => respHeaders.set(k, v));
    if (isTileRequest(routeKey, targetUrl)) {
      respHeaders.set('Cache-Control', TILE_CACHE_CONTROL);
      respHeaders.delete('Pragma');
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Proxy fetch failed', message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
