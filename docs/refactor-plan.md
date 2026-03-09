# 리팩토링 계획

## SearchPanel: getState() → 구독 방식 전환

### 현재

`handleSelect` 콜백 내부에서 `useGpsStore.getState().filteredPosition`으로 직접 접근.

### 변경 방향

컴포넌트 상단에서 `useGpsStore((s) => s.filteredPosition)`으로 구독하고, `handleSelect` 의존성에 추가.

### 이유

- Zustand의 일관된 구독 패턴 유지
- 콜백 내부 `getState()` 사용은 리뷰 시 가독성이 떨어짐
- `handleSelect` 재생성 비용은 유저 액션 기반이라 실질적 성능 영향 없음

## 검색 화면 진입 시 위치 갱신

### 배경

네비게이션 종료 후 유저가 도보 이동 → 재검색 시 `filteredPosition`이 마지막 GPS 위치(오래된 값)로 남아있어 출발지가 실제 위치와 다를 수 있음.

### 변경 방향

`handleSearchTap` (HomePanel) 시점에 `getCurrentPosition`을 호출하여 `filteredPosition`을 갱신.

### 고려사항

- `useInitialPosition`은 앱 진입 시 1회 전용 (`didFetch` ref) → 재사용 불가
- gpsStore에 `refreshPosition` 액션 추가 또는 별도 훅으로 분리 필요
