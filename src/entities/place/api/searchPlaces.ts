import type { Place } from '@entities/place/model';
import { api } from '@shared/api/http';

/** 내부 API Route를 통한 장소 검색 (CORS 회피) */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (!query.trim()) return [];

  return api.get<Place[]>(`/api/search?query=${encodeURIComponent(query)}`, { signal });
}
