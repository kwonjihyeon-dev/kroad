'use client';

import { formatArrivalTime, formatDistance, formatDuration } from '@shared/lib/format';
import styles from './route-info.module.scss';

interface RouteInfoProps {
  duration: number;
  distance: number;
  departureTime: number;
}

/**
 * 경로 요약 정보 — 소요시간, 거리, 도착 예정 시각
 */
export function RouteInfo({ duration, distance, departureTime }: RouteInfoProps) {
  return (
    <div className={styles.container}>
      <span className={styles.duration}>{formatDuration(duration)}</span>
      <span className={styles.distance}>{formatDistance(distance)}</span>
      <span className={styles.arrival}>{formatArrivalTime(departureTime, duration)}</span>
    </div>
  );
}
