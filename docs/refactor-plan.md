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
