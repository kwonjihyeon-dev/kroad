'use client';

import { useUiStore } from '@shared/store/uiStore';
import styles from './home-panel.module.scss';
import { SearchBar } from './SearchBar';

/** 홈 화면 패널 — 검색바 + 현위치 버튼 */
export function HomePanel() {
  const setScreen = useUiStore((s) => s.setScreen);

  const handleSearchTap = () => {
    setScreen('search');
  };

  return (
    <div className={styles.panel}>
      <SearchBar onTap={handleSearchTap} />
    </div>
  );
}
