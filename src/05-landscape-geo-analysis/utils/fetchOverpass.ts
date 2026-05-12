export const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

export interface OverpassJson<T = unknown> {
  elements?: T[];
  [key: string]: unknown;
}

export interface OverpassOptions {
  hedgeDelayMs?: number;
  hedgeRequests?: boolean;
  label?: string;
  retryDelayMs?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_DELAY_MS = 800;
const DEFAULT_HEDGE_DELAY_MS = 700;

function isAbortSignal(value: AbortSignal | OverpassOptions | undefined): value is AbortSignal {
  return !!value && 'aborted' in value && 'addEventListener' in value;
}

function normalizeOptions(options?: AbortSignal | OverpassOptions): OverpassOptions {
  return isAbortSignal(options) ? { signal: options } : (options ?? {});
}

function signalWithTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = window.setTimeout(abort, timeoutMs);

  signal?.addEventListener('abort', abort, { once: true });

  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    cleanup: () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    },
  };
}

function delay(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function fetchMirror<T>(
  mirror: string,
  query: string,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<OverpassJson<T>> {
  const timed = signalWithTimeout(signal, timeoutMs);
  try {
    const res = await fetch(mirror, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      signal: timed.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as OverpassJson<T>;
  } finally {
    timed.cleanup();
  }
}

function fetchOverpassJsonHedged<T>(
  query: string,
  opts: OverpassOptions,
  label: string,
  timeoutMs: number,
): Promise<OverpassJson<T>> {
  const hedgeDelayMs = opts.hedgeDelayMs ?? DEFAULT_HEDGE_DELAY_MS;

  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new Error(`${label} request aborted`));
      return;
    }

    let settled = false;
    let failures = 0;
    const timers: number[] = [];
    const requests: ReturnType<typeof signalWithTimeout>[] = [];
    const errors: string[] = [];

    const cleanupAll = () => {
      timers.forEach(timer => window.clearTimeout(timer));
      requests.forEach(request => {
        request.abort();
        request.cleanup();
      });
      opts.signal?.removeEventListener('abort', abortAll);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanupAll();
      callback();
    };

    const abortAll = () => {
      finish(() => reject(new Error(`${label} request aborted`)));
    };

    opts.signal?.addEventListener('abort', abortAll, { once: true });

    OVERPASS_MIRRORS.forEach((mirror, i) => {
      const timer = window.setTimeout(async () => {
        if (settled) return;
        const request = signalWithTimeout(opts.signal, timeoutMs);
        requests.push(request);

        try {
          const res = await fetch(mirror, {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            signal: request.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json() as OverpassJson<T>;
          finish(() => {
            if (i > 0) console.log(`[OSM] ${label}: 使用備用鏡像 #${i + 1}`);
            resolve(json);
          });
        } catch (e) {
          request.cleanup();
          if (settled) return;
          if (opts.signal?.aborted) {
            finish(() => reject(e));
            return;
          }

          errors[i] = (e as Error).message;
          failures += 1;
          console.warn(
            `[OSM] ${label} 鏡像 ${i + 1}/${OVERPASS_MIRRORS.length} 失敗:`,
            errors[i],
          );
          if (failures === OVERPASS_MIRRORS.length) {
            finish(() => reject(new Error(`所有 Overpass 鏡像均失敗 (${label}): ${errors.filter(Boolean).join(' / ')}`)));
          }
        }
      }, i * hedgeDelayMs);
      timers.push(timer);
    });
  });
}

export async function fetchOverpassJson<T = unknown>(
  query: string,
  options?: AbortSignal | OverpassOptions,
): Promise<OverpassJson<T>> {
  const opts = normalizeOptions(options);
  const label = opts.label ?? 'Overpass';
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  if (opts.hedgeRequests) {
    return fetchOverpassJsonHedged<T>(query, opts, label, timeoutMs);
  }

  for (let i = 0; i < OVERPASS_MIRRORS.length; i += 1) {
    if (opts.signal?.aborted) throw new Error(`${label} request aborted`);
    const mirror = OVERPASS_MIRRORS[i];

    try {
      const json = await fetchMirror<T>(mirror, query, opts.signal, timeoutMs);
      if (i > 0) console.log(`[OSM] ${label}: 使用備用鏡像 #${i + 1}`);
      return json;
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      console.warn(
        `[OSM] ${label} 鏡像 ${i + 1}/${OVERPASS_MIRRORS.length} 失敗:`,
        (e as Error).message,
      );
      if (i < OVERPASS_MIRRORS.length - 1) await delay(retryDelayMs);
    }
  }

  throw new Error(`所有 Overpass 鏡像均失敗 (${label})`);
}

export async function fetchOverpass<T>(
  query: string,
  options?: AbortSignal | OverpassOptions,
): Promise<T[]> {
  const json = await fetchOverpassJson<T>(query, options);
  return json.elements ?? [];
}
