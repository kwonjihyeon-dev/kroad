'use client';

import { formatDistance, formatDuration } from '@shared/lib/format';
import styles from './route-panel.module.scss';

interface RouteCardProps {
  index: number;
  duration: number;
  distance: number;
  arrivalStr: string;
  isSelected: boolean;
  onSelect: () => void;
}

/** 경로 대안 카드 — 소요시간, 도착예정, 거리 */
export function RouteCard({
  index,
  duration,
  distance,
  arrivalStr,
  isSelected,
  onSelect,
}: RouteCardProps) {
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardLabel}>경로 {index + 1}</span>
        <span className={styles.cardDuration}>{formatDuration(duration)}</span>
      </div>
      <div className={styles.cardDetails}>
        <span className={styles.cardArrival}>{arrivalStr} 도착</span>
        <span className={styles.cardDistance}>{formatDistance(distance)}</span>
      </div>
    </button>
  );
}
