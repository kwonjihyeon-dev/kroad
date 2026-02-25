'use client';

import { parseBoldHtml } from '@shared/lib/format';

import type { Place } from '../model/types';
import styles from './place-item.module.scss';

interface PlaceItemProps {
  place: Place;
  onSelect: (place: Place) => void;
}

/** 장소 검색 결과 아이템 */
export function PlaceItem({ place, onSelect }: PlaceItemProps) {
  const titleSegments = parseBoldHtml(place.title);

  return (
    <button className={styles.item} onClick={() => onSelect(place)}>
      <div className={styles.info}>
        <span className={styles.title}>
          {titleSegments.map((seg, i) => (seg.bold ? <b key={i}>{seg.text}</b> : seg.text))}
        </span>
        <span className={styles.category}>{place.category}</span>
      </div>
      <p className={styles.address}>{place.roadAddress || place.address}</p>
    </button>
  );
}
