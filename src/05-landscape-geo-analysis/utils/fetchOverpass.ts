const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export async function fetchOverpass<T>(
  query: string,
  signal?: AbortSignal
): Promise<T[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    signal,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();
  return json.elements ?? [];
}
