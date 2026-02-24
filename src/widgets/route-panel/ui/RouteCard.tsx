'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { formatArrivalTime, formatDistance, formatDuration } from '@shared/lib/format';

import styles from './route-panel.module.scss';

const UPDATE_INTERVAL_MS = 60_000;

/** 매 분마다 갱신되는 현재 시각(분 단위)을 구독한다 */
function subscribeToMinuteTick(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, UPDATE_INTERVAL_MS);
  return () => clearInterval(id);
}

interface RouteCardProps {
  index: number;
  duration: number;
  distance: number;
  isSelected: boolean;
  onSelect: () => void;
}

/** 경로 대안 카드 — 소요시간, 도착예정, 거리 */
export function RouteCard({ index, duration, distance, isSelected, onSelect }: RouteCardProps) {
  const getSnapshot = useCallback(() => formatArrivalTime(duration), [duration]);
  const arrivalStr = useSyncExternalStore(subscribeToMinuteTick, getSnapshot, getSnapshot);

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
