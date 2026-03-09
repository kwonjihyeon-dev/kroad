# Phase 5 구현 가이드 — 턴바이턴 네비게이션

## 개요

OSRM Route API가 반환하는 `steps[].maneuver.location`을 활용하여
현재 위치 기반 회전 안내(턴바이턴 네비게이션)를 구현하는 방법을 설명한다.

---

## 1. maneuver.location이란

OSRM Route API 응답의 각 step에는 `maneuver` 객체가 포함된다.

```json
{
  "steps": [
    {
      "maneuver": {
        "type": "depart",
        "location": [126.978, 37.566]
      },
      "name": "세종대로",
      "distance": 300,
      "duration": 36
    },
    {
      "maneuver": {
        "type": "turn",
        "modifier": "left",
        "location": [126.981, 37.568]
      },
      "name": "종로",
      "distance": 500,
      "duration": 60
    },
    {
      "maneuver": {
        "type": "arrive",
        "location": [126.985, 37.570]
      },
      "name": "목적지",
      "distance": 0,
      "duration": 0
    }
  ]
}
```

- `location`: 해당 회전/방향전환이 발생하는 **정확한 도로 위 좌표** `[lng, lat]`
- `type`: 동작 종류 (`depart`, `turn`, `continue`, `roundabout`, `arrive` 등)
- `modifier`: 방향 (`left`, `right`, `straight`, `slight left`, `slight right`, `sharp left`, `sharp right`, `uturn`)

### 좌표 변환

OSRM은 `[lng, lat]` 순서이므로 프로젝트 내 `Coordinate`(`{ lat, lng }`)로 변환이 필요하다.
이미 `useRouteSearch.ts`에서 `fromOsrmLocation()`으로 변환하여 `RouteStep.maneuver.location`에 저장하고 있다.

```typescript
// shared/lib/coordinateUtils.ts
export function fromOsrmLocation(location: [number, number]): Coordinate {
  return { lat: location[1], lng: location[0] };
}

// features/route-search/model/useRouteSearch.ts — 이미 구현됨
maneuver: {
  type: step.maneuver.type,
  modifier: step.maneuver.modifier,
  location: fromOsrmLocation(step.maneuver.location), // [lng,lat] → {lat,lng}
},
```

---

## 2. Step 진행 추적 로직

### 핵심 원리

`filteredPosition`(도로 스냅된 현재 위치)과 다음 step의 `maneuver.location` 간 거리를 매번 계산한다.
거리가 임계값(STEP_ARRIVAL_THRESHOLD: 30) 이내에 들어오면 해당 step을 "통과"한 것으로 판정하고 다음 step으로 넘어간다.

### 상태

```typescript
interface NavigationState {
  currentStepIndex: number;       // 현재 진행 중인 step 인덱스
  distanceToNextManeuver: number; // 다음 maneuver 지점까지 남은 거리 (m)
  isNavigating: boolean;          // 네비게이션 모드 활성화 여부
}
```

### 통과 판정 순수 함수

```typescript
// features/turn-by-turn/lib/stepProgress.ts

import { distanceBetween } from '@shared/lib/coordinateUtils';
import type { Coordinate } from '@shared/lib/types';
import type { RouteStep } from '@entities/route/model';

const STEP_ARRIVAL_THRESHOLD = 30; // 30m 이내면 step 통과

interface StepProgressResult {
  newStepIndex: number;
  distanceToNext: number;
}

/**
 * 현재 위치 기반으로 step 진행 상태를 계산한다.
 * - 다음 maneuver 지점까지 거리가 임계값 이내이면 step을 넘긴다.
 * - 연속으로 여러 step을 통과할 수 있다 (짧은 step이 연속될 때).
 */
export function calculateStepProgress(
  position: Coordinate,
  steps: RouteStep[],
  currentStepIndex: number,
): StepProgressResult {
  let index = currentStepIndex;

  // 다음 step의 maneuver.location까지 거리 확인
  while (index + 1 < steps.length) {
    const nextManeuver = steps[index + 1].maneuver.location;
    const distance = distanceBetween(position, nextManeuver);

    if (distance <= STEP_ARRIVAL_THRESHOLD) {
      index++; // step 통과
    } else {
      return { newStepIndex: index, distanceToNext: distance };
    }
  }

  // 마지막 step(arrive)에 도달
  return { newStepIndex: index, distanceToNext: 0 };
}
```

### 왜 단순 거리만으로 충분한가 / 한계

단순 거리 비교는 대부분의 경우 잘 동작하지만 다음 케이스에서 오판할 수 있다:

```
문제 상황: U자형 도로에서 maneuver 지점과 직선거리는 가깝지만 도로상으로는 멀 때

  현재위치 ●─────────────┐
                          │  ← 30m 이내지만 아직 도달하지 않음
  maneuver ○─────────────┘
```

더 정확한 판정이 필요하면 **접근/이탈 판별**을 추가한다:

```typescript
/**
 * 이전 거리보다 현재 거리가 멀어지면 "이미 통과한 것"으로 판정
 */
export function hasPassedManeuver(
  prevDistance: number,
  currentDistance: number,
  threshold: number,
): boolean {
  // 임계값 이내에 진입한 적 있고(prevDistance <= threshold),
  // 지금 멀어지고 있으면(currentDistance > prevDistance) 통과한 것
  return prevDistance <= threshold && currentDistance > prevDistance;
}
```

MVP에서는 단순 거리 비교로 시작하고, 테스트 후 필요 시 접근/이탈 판별을 추가하는 것을 권장한다.

---

## 3. Step 추적 훅

```typescript
// features/turn-by-turn/model/useStepTracker.ts

import { useEffect } from 'react';
import { useGpsStore } from '@entities/position/model';
import { useRouteStore } from '@entities/route/model';
import { calculateStepProgress } from '../lib';

/**
 * filteredPosition이 변경될 때마다 step 진행 상태를 갱신한다.
 */
export function useStepTracker() {
  const filteredPosition = useGpsStore((s) => s.filteredPosition);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const navigation = useRouteStore((s) => s.navigation);
  const updateNavigation = useRouteStore((s) => s.updateNavigation);

  useEffect(() => {
    if (!filteredPosition || !activeRoute || !navigation.isNavigating) return;

    const { newStepIndex, distanceToNext } = calculateStepProgress(
      filteredPosition,
      activeRoute.steps,
      navigation.currentStepIndex,
    );

    // 변경이 있을 때만 스토어 업데이트
    if (
      newStepIndex !== navigation.currentStepIndex ||
      distanceToNext !== navigation.distanceToNextManeuver
    ) {
      updateNavigation({
        currentStepIndex: newStepIndex,
        distanceToNextManeuver: distanceToNext,
      });
    }
  }, [filteredPosition, activeRoute, navigation, updateNavigation]);
}
```

---

## 4. Maneuver 타입 → 한글 안내 매핑

```typescript
// features/turn-by-turn/lib/maneuverInstruction.ts

const TYPE_MAP: Record<string, string> = {
  depart: '출발',
  arrive: '도착',
  turn: '회전',
  continue: '직진',
  'new name': '직진',
  merge: '합류',
  'on ramp': '진입',
  'off ramp': '진출',
  fork: '분기',
  'end of road': '도로 끝',
  roundabout: '회전교차로',
  'roundabout turn': '회전교차로',
  rotary: '로터리',
  notification: '',
};

const MODIFIER_MAP: Record<string, string> = {
  uturn: 'U턴',
  'sharp right': '크게 우회전',
  right: '우회전',
  'slight right': '살짝 우회전',
  straight: '직진',
  'slight left': '살짝 좌회전',
  left: '좌회전',
  'sharp left': '크게 좌회전',
};

/**
 * OSRM maneuver를 한글 안내 문자열로 변환한다.
 *
 * 예시:
 * - { type: "turn", modifier: "left" }  → "좌회전"
 * - { type: "depart" }                  → "출발"
 * - { type: "arrive" }                  → "도착"
 * - { type: "roundabout", modifier: "right" } → "회전교차로 우회전"
 */
export function toInstruction(type: string, modifier?: string): string {
  if (type === 'arrive') return '도착';
  if (type === 'depart') return '출발';

  const modifierText = modifier ? MODIFIER_MAP[modifier] ?? modifier : null;
  const typeText = TYPE_MAP[type] ?? type;

  // modifier가 있으면 modifier 우선 (예: "좌회전")
  // roundabout 등 type이 의미 있으면 조합 (예: "회전교차로 우회전")
  if (type === 'roundabout' || type === 'rotary') {
    return modifierText ? `${typeText} ${modifierText}` : typeText;
  }

  return modifierText ?? typeText;
}
```

---

## 5. UI에서 안내 표시

```typescript
// 사용 예시 (NavigationPanel 내부)

const activeRoute = useRouteStore((s) => s.activeRoute);
const { currentStepIndex, distanceToNextManeuver } = useRouteStore((s) => s.navigation);

const currentStep = activeRoute.steps[currentStepIndex];
const nextStep = activeRoute.steps[currentStepIndex + 1];

// 다음 회전 안내
if (nextStep) {
  const instruction = toInstruction(nextStep.maneuver.type, nextStep.maneuver.modifier);
  const roadName = nextStep.name;

  // 렌더링: "300m 후 좌회전" + "종로"
  // distanceToNextManeuver → formatDistance()로 포맷팅
}
```

---

## 6. 전체 데이터 흐름 요약

```
OSRM Route API 응답
  │
  ▼
useRouteSearch — steps[].maneuver.location을 Coordinate로 변환
  │
  ▼
routeStore.activeRoute.steps — RouteStep[] 저장
  │
  ├─ [안내시작 버튼] → navigation.isNavigating = true
  │
  ▼
useStepTracker (filteredPosition 변화 감지)
  │
  ├─ calculateStepProgress() — 다음 maneuver까지 거리 계산
  │   ├─ 30m 이내 → currentStepIndex++ (step 통과)
  │   └─ 30m 초과 → distanceToNextManeuver 갱신
  │
  ▼
NavigationPanel UI
  ├─ toInstruction(type, modifier) → "300m 후 좌회전"
  ├─ nextStep.name → "종로"
  └─ 남은 거리/시간 표시
```

---

## 7. 관련 파일

| 파일 | 역할 |
| --- | --- |
| `entities/route/model/types.ts` | `RouteStep`, `NavigationState` 타입 |
| `entities/route/model/routeStore.ts` | navigation 상태 관리 |
| `features/turn-by-turn/lib/stepProgress.ts` | step 통과 판정 순수 함수 |
| `features/turn-by-turn/lib/maneuverInstruction.ts` | maneuver → 한글 안내 변환 |
| `features/turn-by-turn/model/useStepTracker.ts` | step 진행 추적 훅 |
| `widgets/navigation-panel/ui/NavigationPanel.tsx` | 회전 안내 UI |
| `shared/lib/coordinateUtils.ts` | `distanceBetween`, `fromOsrmLocation` |

---

## 8. 설정 상수 (추가 예정)

```typescript
// shared/config/navigation.ts
export const NAVIGATION_CONFIG = {
  STEP_ARRIVAL_THRESHOLD: 30,   // step 통과 판정 거리 (m)
  ARRIVAL_THRESHOLD: 50,        // 최종 도착 판정 거리 (m)
} as const;
```
