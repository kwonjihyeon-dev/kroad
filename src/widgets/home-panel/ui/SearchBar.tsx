'use client';

import styles from './home-panel.module.scss';

interface SearchBarProps {
  onTap: () => void;
}

/** 홈 화면 검색 트리거 바 (탭 시 검색 화면으로 전환, 직접 입력 불가) */
export function SearchBar({ onTap }: SearchBarProps) {
  return (
    <button className={styles.searchBar} onClick={onTap}>
      <svg
        className={styles.searchIcon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <span className={styles.placeholder}>장소, 주소 검색</span>
    </button>
  );
}
