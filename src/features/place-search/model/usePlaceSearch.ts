'use client';

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { searchPlaces } from '@entities/place';

const DEBOUNCE_MS = 300;

/**
 * 장소 검색 훅 (300ms 디바운스 + TanStack Query 캐싱)
 */
export function usePlaceSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['placeSearch', debouncedQuery],
    queryFn: () => searchPlaces(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });
}
