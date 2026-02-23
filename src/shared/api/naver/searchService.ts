import type { Place } from '@entities/place';

/** 내부 API Route를 통한 장소 검색 (CORS 회피) */
export async function searchPlaces(query: string): Promise<Place[]> {
  if (!query.trim()) return [];

  const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);

  if (!res.ok) {
    throw new Error(`검색 실패: ${res.status}`);
  }

  const data: Place[] = await res.json();
  return data;
}
