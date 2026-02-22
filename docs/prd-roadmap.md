# prd-roadmap.md — Kroad MVP

## MVP 기능 목록

1. 실시간 GPS 추적 + 마커 이동
2. 출발지 → 도착지 경로 탐색
3. 경로 이탈 시 재탐색

---

## 디렉토리 구조

```
app/                          ← Next.js App Router (라우팅 전용)
├── layout.tsx
└── page.tsx

src/                          ← FSD 레이어 (비즈니스 로직)
├── app/                      ← FSD app 레이어 (전역 구성)
│   ├── globals.scss
│   ├── providers.tsx
│   └── favicon.ico
│
├── views/
│   └── map/
│       └── ui/MapPage.tsx
│
├── widgets/
│   ├── navigation-panel/
│   │   └── ui/NavigationPanel.tsx
│   ├── search-panel/
│   │   └── ui/SearchPanel.tsx
│   └── map-view/
│       └── ui/MapView.tsx
│
├── features/
│   ├── gps-tracking/
│   │   ├── model/
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useKalmanFilter.ts
│   │   │   └── useGpsTracking.ts
│   │   ├── lib/
│   │   │   └── kalmanFilter.ts
│   │   └── index.ts
│   │
│   ├── route-search/
│   │   ├── model/
│   │   │   └── useRouteSearch.ts
│   │   ├── ui/
│   │   │   ├── SearchInput.tsx
│   │   │   └── RouteAlternatives.tsx
│   │   └── index.ts
│   │
│   ├── route-deviation/
│   │   ├── model/
│   │   │   └── useRouteDeviation.ts
│   │   ├── lib/
│   │   │   └── deviationDetector.ts
│   │   ├── ui/
│   │   │   └── RerouteNotice.tsx
│   │   └── index.ts
│   │
│   └── map-matching/
│       ├── model/
│       │   └── useMapMatching.ts
│       └── index.ts
│
├── entities/
│   ├── position/
│   │   ├── model/
│   │   │   ├── gpsStore.ts
│   │   │   └── types.ts
│   │   ├── ui/
│   │   │   └── CurrentMarker.tsx
│   │   └── index.ts
│   │
│   ├── route/
│   │   ├── model/
│   │   │   ├── routeStore.ts
│   │   │   └── types.ts
│   │   ├── ui/
│   │   │   ├── RoutePolyline.tsx
│   │   │   └── RouteInfo.tsx
│   │   └── index.ts
│   │
│   └── destination/
│       ├── model/
│       │   └── types.ts
│       ├── ui/
│       │   └── DestinationMarker.tsx
│       └── index.ts
│
└── shared/
    ├── api/osrm/
    │   ├── osrmClient.ts
    │   ├── routeService.ts
    │   ├── matchService.ts
    │   ├── queryKeys.ts
    │   └── types.ts
    ├── config/
    │   ├── map.ts
    │   ├── gps.ts
    │   └── route.ts
    ├── lib/
    │   ├── types.ts
    │   ├── coordinateUtils.ts
    │   ├── format.ts
    │   └── naverMaps.ts
    ├── ui/
    │   ├── Loading.tsx
    │   ├── ErrorBoundary.tsx
    │   └── styles/
    │       ├── _variables.scss
    │       ├── _mixins.scss
    │       └── _animations.scss
    ├── store/
    │   └── uiStore.ts
    └── __dev__/
        └── gpsSimulator.ts
```

---

## 타입 정의

```typescript
// shared/lib/types.ts — 모든 레이어에서 공용
interface Coordinate {
  lat: number;
  lng: number;
}

// entities/position/model/types.ts — Coordinate를 shared에서 re-export

interface GpsPosition extends Coordinate {
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface FilteredPosition extends Coordinate {
  raw: GpsPosition;
  isSnapped: boolean;
}

// entities/route/model/types.ts
interface RouteResult {
  geometry: Coordinate[];
  duration: number;
  distance: number;
  steps: RouteStep[];
}

interface RouteStep {
  maneuver: {
    type: string;
    modifier?: string;
    location: Coordinate;
  };
  name: string;
  distance: number;
  duration: number;
}

interface DeviationState {
  isDeviated: boolean;
  distanceFromRoute: number;
  deviationStartTime: number | null;
  isRerouting: boolean;
}

// shared/api/osrm/types.ts
interface OsrmRouteResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: OsrmWaypoint[];
}

interface OsrmRoute {
  geometry: string;
  duration: number;
  distance: number;
  legs: OsrmLeg[];
}

interface OsrmLeg {
  steps: OsrmStep[];
  duration: number;
  distance: number;
}

interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [lng, lat]
  };
  name: string;
  distance: number;
  duration: number;
}

interface OsrmMatchResponse {
  code: string;
  matchings: OsrmMatching[];
  tracepoints: (OsrmTracepoint | null)[];
}

interface OsrmTracepoint {
  location: [number, number];
  name: string;
}
```

---

## Zustand Store 설계

```typescript
// entities/position/model/gpsStore.ts
interface GpsStore {
  rawPosition: GpsPosition | null;
  filteredPosition: FilteredPosition | null;
  isTracking: boolean;
  positionHistory: FilteredPosition[];

  updateRawPosition: (pos: GpsPosition) => void;
  updateFilteredPosition: (pos: FilteredPosition) => void;
  startTracking: () => void;
  stopTracking: () => void;
}

// entities/route/model/routeStore.ts
interface RouteStore {
  origin: Coordinate | null;
  destination: Coordinate | null;
  activeRoute: RouteResult | null;
  alternativeRoutes: RouteResult[];
  deviation: DeviationState;

  setOrigin: (coord: Coordinate) => void;
  setDestination: (coord: Coordinate) => void;
  setActiveRoute: (route: RouteResult) => void;
  setAlternativeRoutes: (routes: RouteResult[]) => void;
  updateDeviation: (state: Partial<DeviationState>) => void;
  clearRoute: () => void;
}

// shared/store/uiStore.ts
interface UiStore {
  isSearchPanelOpen: boolean;
  isNavigating: boolean;
  isLoading: boolean;
  error: string | null;

  toggleSearchPanel: () => void;
  setNavigating: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
}
```

---

## TanStack Query 키

```typescript
// shared/api/osrm/queryKeys.ts
const queryKeys = {
  route: (origin: Coordinate, dest: Coordinate) =>
    ["route", origin.lat, origin.lng, dest.lat, dest.lng] as const,

  match: (coordinates: Coordinate[]) =>
    ["match", coordinates.map((c) => `${c.lat},${c.lng}`).join("|")] as const,

  reroute: (current: Coordinate, dest: Coordinate) =>
    ["reroute", current.lat, current.lng, dest.lat, dest.lng] as const,
};
```

---

## 상수 정의

```typescript
// shared/config/gps.ts
export const GPS_CONFIG = {
  WATCH_INTERVAL: 1000,
  BATCH_INTERVAL: 5000,
  HISTORY_SIZE: 20,
  HIGH_ACCURACY: true,
  MAX_AGE: 0,
  TIMEOUT: 10000,
} as const;

// shared/config/route.ts
export const ROUTE_CONFIG = {
  DEVIATION_THRESHOLD: 50, // 이탈 판정 거리 (m)
  DEVIATION_TIME_THRESHOLD: 5000, // 이탈 지속 시간 (ms)
  REROUTE_DEBOUNCE: 10000, // 재탐색 최소 간격 (ms)
  MAX_ALTERNATIVES: 3,
  SNAP_RADIUS: 20,
} as const;

// shared/config/map.ts
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 37.5665, lng: 126.978 },
  DEFAULT_ZOOM: 16,
  NAVIGATION_ZOOM: 17,
  MARKER_ANIMATION_DURATION: 1000,
  POLYLINE_COLOR: "#4A90D9",
  ALT_POLYLINE_COLOR: "#CCCCCC",
  POLYLINE_WIDTH: 6,
} as const;
```

---

## 기능 상세 스펙

### 기능 1: 실시간 GPS 추적 + 마커 이동

- 브라우저 Geolocation API watchPosition으로 1~2초 간격 수집
- 칼만 필터로 노이즈 제거 (3~15m 오차 보정)
- 5~10초 간격으로 좌표 배치 수집 → OSRM Map Matching API로 도로 스냅
- 마커는 CSS transition으로 부드럽게 애니메이션 이동

**GPS 처리 파이프라인:**

```
Geolocation API → 칼만 필터 → 좌표 배치 수집 → OSRM Map Matching
  → 마커 애니메이션 업데이트
  → 이탈 감지 (경로 안내 모드일 때)
```

**칼만 필터 (중고등학생 설명 버전):**

```
시험 점수를 예측한다고 해보자.

[예측] 지난 시험 80점 + 최근 공부량 → "이번엔 83점쯤 나올 듯"
[실제] 시험 봤더니 78점
[보정] 예측(83)과 실제(78) 사이에서 → "내 예측이 60% 신뢰, GPS가 40% 신뢰"
       → 최종 점수 = 83 × 0.6 + 78 × 0.4 = 81점

GPS도 동일:
[예측] 이전 위치 + 속도 → "지금쯤 여기 있겠지"
[실제] GPS가 알려준 좌표 (근데 좀 튀어있음)
[보정] 예측값과 GPS값의 가중평균 → 부드러운 최종 좌표
```

### 기능 2: 출발지 → 도착지 경로 탐색

- 출발지: 현재 GPS 자동 설정 또는 수동 입력
- 도착지: 검색 또는 지도 탭 설정
- OSRM Route API → geometry polyline 디코딩 → Naver Maps 폴리라인 렌더링
- 예상 소요시간, 총 거리 표시
- 대안 경로 최대 3개 (alternatives=true)

**OSRM Route 응답 핵심:**

```json
{
  "routes": [
    {
      "geometry": "encoded_polyline_string",
      "duration": 1234.5,
      "distance": 15000.2,
      "legs": [
        {
          "steps": [
            {
              "maneuver": {
                "type": "turn",
                "modifier": "left",
                "location": [126.978, 37.566]
              },
              "name": "세종대로",
              "distance": 500,
              "duration": 60
            }
          ]
        }
      ]
    }
  ]
}
```

### 기능 3: 경로 이탈 시 재탐색

- 현재 GPS ↔ 경로 폴리라인 최단거리 실시간 계산
- 이탈 기준: 50m 이상 벗어남 + 5초 이상 지속
- 재탐색: 현재 위치 → 기존 도착지로 Route API 재호출
- 디바운싱: 최소 10초 간격

**이탈 판정 흐름:**

```
매 GPS 업데이트
  → 경로 폴리라인까지 최단거리 계산
  → 50m 초과? → 이탈 카운터 시작
  → 5초 연속 이탈? → 재탐색 트리거
  → 경로 복귀 시 → 카운터 리셋
```

---

## ESLint FSD 설정

```javascript
// eslint.config.mjs
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/*" },
        { type: "views", pattern: "src/views/*" },
        { type: "widgets", pattern: "src/widgets/*" },
        { type: "features", pattern: "src/features/*" },
        { type: "entities", pattern: "src/entities/*" },
        { type: "shared", pattern: "src/shared/*" },
      ],
      "boundaries/ignore": [],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "app",
              allow: ["views", "widgets", "features", "entities", "shared"],
            },
            {
              from: "views",
              allow: ["widgets", "features", "entities", "shared"],
            },
            { from: "widgets", allow: ["features", "entities", "shared"] },
            { from: "features", allow: ["entities", "shared"] },
            { from: "entities", allow: ["shared"] },
            { from: "shared", allow: ["shared"] },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              target: ["views", "widgets", "features", "entities"],
              allow: ["index.ts", "index.tsx"],
            },
            { target: ["shared"], allow: "**" },
            { target: ["app"], allow: "**" },
          ],
        },
      ],
    },
  },
];
```

---

## Prettier import 정렬 설정

```javascript
// prettier.config.mjs
export default {
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 100,

  plugins: ["@ianvs/prettier-plugin-sort-imports"],

  // import 정렬 순서 (빈 문자열 '' 로 그룹 사이 빈 줄 삽입)
  importOrder: [
    // 1. React / Next.js
    "^react$",
    "^react/(.*)$",
    "^next$",
    "^next/(.*)$",
    "",
    // 2. 외부 라이브러리
    "<THIRD_PARTY_MODULES>",
    "",
    // 3. FSD 레이어 순서 (상위 → 하위)
    "^@app/(.*)$",
    "^@views/(.*)$",
    "^@widgets/(.*)$",
    "^@features/(.*)$",
    "^@entities/(.*)$",
    "^@shared/(.*)$",
    "",
    // 4. 상대 경로
    "^[.]",
    "",
    // 5. 스타일 (SCSS, CSS)
    "^.+\\.s?css$",
  ],
};
```

**정렬 결과 예시:**

```typescript
// 1. React / Next
import { useEffect, useState } from "react";
import Script from "next/script";

// 2. 외부 라이브러리
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

// 3. FSD 레이어 (상위 → 하위)
import { useGpsTracking } from "@features/gps-tracking";
import { useRouteSearch } from "@features/route-search";
import { CurrentMarker } from "@entities/position";
import { RoutePolyline } from "@entities/route";
import { MAP_CONFIG } from "@shared/config/map";
import { osrmClient } from "@shared/api/osrm";

// 4. 상대 경로
import { helper } from "./utils";

// 5. 스타일
import styles from "./map-view.module.scss";
```

---

## Phase별 실행 지침

### Phase 1: 기반 세팅

> 순서대로 실행. 각 단계 완료 후 빌드 에러 없는지 확인.

1. **Next.js 프로젝트 초기화**
   - `pnpm create next-app . --typescript --tailwind --eslint --app --src-dir`
   - SCSS: `pnpm add -D sass`
   - `globals.scss`에 Tailwind 디렉티브 + SCSS 변수 세팅

2. **FSD 디렉토리 구조 생성**
   - 위 디렉토리 구조의 모든 폴더와 index.ts 생성
   - 각 index.ts에는 빈 export 또는 placeholder

3. **ESLint + Prettier 설정**
   - `pnpm add -D eslint-plugin-boundaries`
   - `pnpm add -D prettier @ianvs/prettier-plugin-sort-imports`
   - eslint.config.mjs → FSD 의존성 규칙 적용
   - prettier.config.mjs → import 정렬 규칙 적용
   - 테스트: 의도적 위반 import → ESLint 에러 확인 → 제거
   - 테스트: 파일 저장 → import 순서 자동 정렬 확인

4. **Naver Maps SDK 연동**
   - `next/script`로 SDK 로딩 (afterInteractive)
   - `shared/lib/naverMaps.ts` 초기화 유틸
   - `widgets/map-view/ui/MapView.tsx` 기본 지도 ('use client')
   - `app/page.tsx`에서 지도 표시 확인

5. **타입 + 상수 파일 작성**
   - 위 타입 정의, 상수 정의 섹션 그대로 구현

6. **Zustand 스토어 구현**
   - gpsStore, routeStore, uiStore

7. **SCSS 테마 + 공용 스타일**
   - `_variables.scss`, `_mixins.scss`, `_animations.scss`

### Phase 2: GPS 추적

> Phase 1 완료 후. GPS 시뮬레이터 먼저 만들어 물리적 이동 없이 테스트.

8. `features/gps-tracking/model/useGeolocation.ts` — watchPosition 래핑
9. `features/gps-tracking/lib/kalmanFilter.ts` — KalmanFilter 클래스
10. `shared/__dev__/gpsSimulator.ts` — 서울 도로 좌표 시퀀스 + 이탈 시나리오
11. `entities/position/ui/CurrentMarker.tsx` — 마커 + 애니메이션
12. `features/map-matching/model/useMapMatching.ts` — 배치 수집 + API 호출

### Phase 3: 경로 탐색

13. `shared/api/osrm/routeService.ts` — Route API 클라이언트
14. `features/route-search/ui/SearchInput.tsx` — 출발지/도착지 입력
15. `entities/route/ui/RoutePolyline.tsx` — 경로 폴리라인
16. `features/route-search/ui/RouteAlternatives.tsx` — 대안 경로
17. `entities/route/ui/RouteInfo.tsx` — 거리/시간 패널

### Phase 4: 경로 이탈 + 재탐색

18. `features/route-deviation/lib/deviationDetector.ts` — 이탈 감지 로직
19. `features/route-deviation/model/useRouteDeviation.ts` — 재탐색 트리거
20. `features/route-deviation/ui/RerouteNotice.tsx` — 재탐색 UI
21. GPS 시뮬레이터로 전체 시나리오 통합 검증
