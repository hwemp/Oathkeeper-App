// Supplied by the publisher when building; community members never enter a URL.
export function serviceOrigin(value: string): string {
  if (!value.trim()) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Community service must be an HTTPS origin without credentials, paths or query parameters.');
  }
  return url.origin;
}
export const origin = serviceOrigin(import.meta.env.VITE_COMMUNITY_URL || '');
export const base = origin ? origin + '/api/community' : '';
export async function api<T = { ok: boolean }>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (!base) throw new Error('The online community is not available yet. No website setup is needed in the app.');
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid community request.');
  let response: Response;
  try {
    response = await fetch(base + path, {
      method, credentials: 'include', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Oathkeeper-Request': '1' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
  } catch { throw new Error('Community is unavailable right now. Check your connection and try again.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('Community is unavailable right now. Please try again.'); }
  if (!response.ok) throw new Error(data.error ?? 'The request failed. Please try again.');
  return data as T;
}
