'use client';

import styles from './route-panel.module.scss';

interface RouteHeaderProps {
  originName: string;
  destinationName: string;
  onBack: () => void;
}

/** 경로 탐색 헤더 — 출발지/도착지 표시 */
export function RouteHeader({ originName, destinationName, onBack }: RouteHeaderProps) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack} aria-label="뒤로가기">
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
      <div className={styles.endpoints}>
        <div className={styles.endpoint}>
          <span className={styles.dot} data-type="origin" />
          <span className={styles.name}>{originName}</span>
        </div>
        <div className={styles.endpoint}>
          <span className={styles.dot} data-type="destination" />
          <span className={styles.name}>{destinationName}</span>
        </div>
      </div>
    </div>
  );
}
