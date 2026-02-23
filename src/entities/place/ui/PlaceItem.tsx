'use client';

import type { Place } from '../model/types';

import styles from './place-item.module.scss';

interface PlaceItemProps {
  place: Place;
  onSelect: (place: Place) => void;
}

/** 장소 검색 결과 아이템 */
export function PlaceItem({ place, onSelect }: PlaceItemProps) {
  return (
    <button className={styles.item} onClick={() => onSelect(place)}>
      <div className={styles.info}>
        <span
          className={styles.title}
          dangerouslySetInnerHTML={{ __html: place.title }}
        />
        <span className={styles.category}>{place.category}</span>
      </div>
      <p className={styles.address}>{place.roadAddress || place.address}</p>
    </button>
  );
}
