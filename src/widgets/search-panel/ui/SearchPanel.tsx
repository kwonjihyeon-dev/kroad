'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaceSearch } from '@features/place-search/model';
import type { Place } from '@entities/place/model';
import { usePlaceStore } from '@entities/place/model';
import { useRouteStore } from '@entities/route/model';
import { useUiStore } from '@shared/store/uiStore';
import styles from './search-panel.module.scss';
import { SearchResults } from './SearchResults';

/** 검색 화면 패널 — 검색 input + 결과 목록 */
export function SearchPanel() {
  const setScreen = useUiStore((s) => s.setScreen);
  const { setSelectedPlace, setSearchQuery, searchQuery } = usePlaceStore();
  const setDestination = useRouteStore((s) => s.setDestination);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const { data: results = [], isLoading } = usePlaceSearch(localQuery);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBack = useCallback(() => {
    setScreen('home');
  }, [setScreen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    setSearchQuery(e.target.value);
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
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
            value={localQuery}
            onChange={handleInputChange}
            placeholder="장소, 주소 검색"
            autoComplete="off"
          />
          {localQuery && (
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
