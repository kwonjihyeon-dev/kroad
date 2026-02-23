'use client';

import type { Place } from '@entities/place';
import { PlaceItem } from '@entities/place';

import styles from './search-panel.module.scss';

interface SearchResultsProps {
  results: Place[];
  isLoading: boolean;
  onSelect: (place: Place) => void;
}

/** 검색 결과 목록 */
export function SearchResults({ results, isLoading, onSelect }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className={styles.status}>
        <span>검색 중...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={styles.results}>
      {results.map((place) => (
        <PlaceItem key={place.id} place={place} onSelect={onSelect} />
      ))}
    </div>
  );
}
