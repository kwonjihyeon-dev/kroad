'use client';

import { formatDistance, formatDuration } from '@shared/lib/format';

import styles from './route-panel.module.scss';

interface RouteCardProps {
  index: number;
  duration: number;
  distance: number;
  isSelected: boolean;
  onSelect: () => void;
}

/** 경로 대안 카드 — 소요시간, 도착예정, 거리 */
export function RouteCard({ index, duration, distance, isSelected, onSelect }: RouteCardProps) {
  const arrivalTime = new Date(Date.now() + duration * 1000);
  const arrivalStr = `${arrivalTime.getHours()}:${String(arrivalTime.getMinutes()).padStart(2, '0')}`;

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
