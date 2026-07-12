import { useEffect, useState } from 'react';
import { WaqiStationDetail, normalizeWaqiStationDetail } from '../aqi';

export type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; detail: WaqiStationDetail }
  | { status: 'error'; error: string };

const WAQI_BASE_URL = process.env.VITE_WAQI_API_BASE_URL || '/api/waqi';
const detailCache = new Map<string, WaqiStationDetail>();

export function useStationDetail(providerId?: string): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'idle' });

  useEffect(() => {
    if (!providerId) {
      setState({ status: 'idle' });
      return undefined;
    }

    const cached = detailCache.get(providerId);
    if (cached) {
      setState({ status: 'loaded', detail: cached });
      return undefined;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    fetch(`${WAQI_BASE_URL}?uid=${encodeURIComponent(providerId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload?.error || `WAQI detail failed (${response.status})`
          );
        }
        if (payload?.status && payload.status !== 'ok') {
          throw new Error(payload.data || 'WAQI returned no detail data.');
        }
        const detail = normalizeWaqiStationDetail(payload);
        if (!detail) {
          throw new Error('WAQI detail data could not be read.');
        }
        return detail;
      })
      .then((detail) => {
        detailCache.set(providerId, detail);
        if (!cancelled) setState({ status: 'loaded', detail });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setState({ status: 'error', error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  return state;
}
