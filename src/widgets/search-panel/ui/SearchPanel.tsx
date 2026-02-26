'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchPlaces } from '@entities/place/api';
import type { Place } from '@entities/place/model';
import { usePlaceStore } from '@entities/place/model';
import { useRouteStore } from '@entities/route/model';
import { useUiStore } from '@shared/store/uiStore';
import styles from './search-panel.module.scss';
import { SearchResults } from './SearchResults';

const DEBOUNCE_MS = 300;

/** 검색 화면 패널 — 검색 input + 결과 목록 */
export function SearchPanel() {
  const setScreen = useUiStore((s) => s.setScreen);
  const { setSelectedPlace, setSearchQuery, searchQuery } = usePlaceStore();
  const setDestination = useRouteStore((s) => s.setDestination);
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBack = useCallback(() => {
    setScreen('home');
  }, [setScreen]);

  const fetchPlaces = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await searchPlaces(query, controller.signal);
        setResults(data);
      } catch (e) {
        const isAborted = e instanceof DOMException && e.name === 'AbortError';
        if (!isAborted) setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchPlaces(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    fetchPlaces('');
    inputRef.current?.focus();
  };

  const handleSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place);
      setDestination(place.coordinate);
      setScreen('route');
    },
    [setSelectedPlace, setDestination, setScreen],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBack} aria-label="뒤로가기">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="장소, 주소 검색"
            autoComplete="off"
          />
          {searchQuery && (
            <button className={styles.clearButton} onClick={handleClear} aria-label="지우기">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <SearchResults results={results} isLoading={isLoading} onSelect={handleSelect} />
    </div>
  );
}
