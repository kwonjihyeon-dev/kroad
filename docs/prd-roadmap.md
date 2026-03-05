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
│   └── favicon.ico
│
├── views/
│   └── map/
│       └── ui/
│           ├── MapPage.tsx
│           └── index.ts
│
├── widgets/
│   ├── home-panel/
│   │   └── ui/
│   │       ├── HomePanel.tsx
│   │       ├── SearchBar.tsx
│   │       ├── home-panel.module.scss
│   │       └── index.ts
│   ├── search-panel/
│   │   └── ui/
│   │       ├── SearchPanel.tsx
│   │       ├── SearchResults.tsx
│   │       ├── search-panel.module.scss
│   │       └── index.ts
│   ├── route-panel/
│   │   └── ui/
│   │       ├── RoutePanel.tsx
│   │       ├── RouteHeader.tsx
│   │       ├── RouteCard.tsx
│   │       ├── route-panel.module.scss
│   │       └── index.ts
│   ├── navigation-panel/
│   │   └── ui/
│   │       ├── NavigationPanel.tsx
│   │       └── index.ts
│   └── map-view/
│       └── ui/
│           ├── MapView.tsx
│           └── index.ts
│
├── features/
│   ├── gps-tracking/
│   │   ├── model/
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useKalmanFilter.ts
│   │   │   ├── useGpsTracking.ts
│   │   │   └── index.ts
│   │   └── lib/
│   │       ├── kalmanFilter.ts
│   │       └── index.ts
│   │
│   ├── route-search/
│   │   ├── model/
│   │   │   ├── useRouteSearch.ts
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── SearchInput.tsx
│   │       ├── RouteAlternatives.tsx
│   │       └── index.ts
│   │
│   ├── route-deviation/
│   │   ├── model/
│   │   │   ├── useRouteDeviation.ts
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── deviationDetector.ts
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── RerouteNotice.tsx
│   │       └── index.ts
│   │
│   └── map-matching/
│       └── model/
│           ├── useMapMatching.ts
│           └── index.ts
│
├── entities/
│   ├── position/
│   │   ├── model/
│   │   │   ├── gpsStore.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── CurrentMarker.tsx
│   │       └── index.ts
│   │
│   ├── route/
│   │   ├── model/
│   │   │   ├── routeStore.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── RoutePolyline.tsx
│   │       ├── RouteInfo.tsx
│   │       └── index.ts
│   │
│   ├── place/
│   │   ├── model/
│   │   │   ├── placeStore.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── PlaceItem.tsx
│   │   │   ├── place-item.module.scss
│   │   │   └── index.ts
│   │   └── api/
│   │       ├── searchPlaces.ts
│   │       └── index.ts
│   │
│   └── destination/
│       ├── model/
│       │   ├── types.ts
│       │   └── index.ts
│       └── ui/
│           ├── DestinationMarker.tsx
│           └── index.ts
│
├── shared/
│   ├── api/osrm/
│   │   ├── osrmClient.ts
│   │   ├── routeService.ts
│   │   ├── matchService.ts
│   │   └── types.ts
│   ├── config/
│   │   ├── map.ts
│   │   ├── gps.ts
│   │   └── route.ts
│   ├── lib/
│   │   ├── types.ts
│   │   ├── coordinateUtils.ts
│   │   ├── format.ts
│   │   └── naverMaps.ts
│   ├── ui/
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── styles/
│   │       ├── _variables.scss
│   │       ├── _mixins.scss
│   │       └── _animations.scss
│   └── store/
│       └── uiStore.ts
│
└── __dev__/                     ← 개발 전용 (FSD 레이어 외부)
    ├── GpsTestPanel.tsx
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

// entities/place/model/types.ts
interface Place {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  category?: string;
  distance?: number; // 현재 위치로부터 거리 (m)
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

// entities/place/model/placeStore.ts
interface PlaceStore {
  searchQuery: string;
  searchResults: Place[];
  selectedPlace: Place | null;
  isSearching: boolean;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Place[]) => void;
  selectPlace: (place: Place) => void;
  clearSearch: () => void;
  setIsSearching: (value: boolean) => void;
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
type AppScreen = 'home' | 'search' | 'route' | 'navigation';

interface UiStore {
  currentScreen: AppScreen;
  isNavigating: boolean;
  isLoading: boolean;
  error: string | null;

  setScreen: (screen: AppScreen) => void;
  setNavigating: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
}
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
  POLYLINE_COLOR: '#4A90D9',
  ALT_POLYLINE_COLOR: '#CCCCCC',
  POLYLINE_WIDTH: 6,
} as const;
```

---

## 기능 상세 스펙

### 기능 1: 실시간 GPS 추적 + 마커 이동

- 브라우저 Geolocation API watchPosition으로 좌표 변경 시 이벤트 수신 (모바일 기준 대략 1초 전후, 보장되지 않음. => 개발 시 필요한 GPS 시뮬레이터 1초 설정)
- 칼만 필터로 노이즈 제거 (3~15m 오차 보정)
- 5~10초 간격으로 좌표 배치 수집 → OSRM Map Matching API로 도로 스냅
- 마커는 CSS transition으로 부드럽게 애니메이션 이동

**GPS 처리 파이프라인:**

```
Geolocation API → 칼만 필터 → 좌표 배치 수집 → OSRM Map Matching
  → 마커 애니메이션 업데이트
  → 이탈 감지 (경로 안내 모드일 때)
```

**칼만 필터 설명**

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
import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'views', pattern: 'src/views/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
      'boundaries/ignore': [],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app',
              allow: ['views', 'widgets', 'features', 'entities', 'shared'],
            },
            {
              from: 'views',
              allow: ['widgets', 'features', 'entities', 'shared'],
            },
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            { from: 'features', allow: ['entities', 'shared'] },
            { from: 'entities', allow: ['shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              target: ['views', 'widgets', 'features', 'entities'],
              allow: ['index.ts', 'index.tsx'],
            },
            { target: ['shared'], allow: '**' },
            { target: ['app'], allow: '**' },
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
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 100,

  plugins: ['@ianvs/prettier-plugin-sort-imports'],

  importOrder: [
    '^react$',
    '^react/(.*)$',
    '^next$',
    '^next/(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@app/(.*)$',
    '^@views/(.*)$',
    '^@widgets/(.*)$',
    '^@features/(.*)$',
    '^@entities/(.*)$',
    '^@shared/(.*)$',
    '^[.]',
    '^.+\\.s?css$',
  ],
};
```

**정렬 결과 예시:**

```typescript
// 1. React / Next
import { useEffect, useState } from 'react';
import Script from 'next/script';

// 2. 외부 라이브러리
import { create } from 'zustand';

// 3. FSD 레이어 (상위 → 하위)
import { useGpsTracking } from '@features/gps-tracking';
import { useRouteSearch } from '@features/route-search';
import { CurrentMarker } from '@entities/position';
import { RoutePolyline } from '@entities/route';
import { osrmClient } from '@shared/api/osrm';
import { MAP_CONFIG } from '@shared/config/map';

// 5. 스타일
import styles from './map-view.module.scss';
// 4. 상대 경로
import { helper } from './utils';
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

### Phase 2: UI 플로우 (홈 → 검색 → 경로 탐색)

> Phase 1 완료 후. MVP 핵심 화면 전환 플로우를 구축.
> 홈은 검색바만, 검색은 자동완성 중심, 결과 선택 시 경로 탐색으로 이동.

**화면 전환 흐름:**

```
[홈 화면] → 검색바 탭 → [검색 화면] → 자동완성 결과 선택 → [경로 탐색 화면] → 안내시작 → [내비게이션]
    ↑                        ↑       ↑                             ↑
    └── 뒤로가기 ──────────────┘       │                             │
                                     └── 뒤로가기 ───────────────────┘
```

**화면별 구성:**

#### 2-1. 홈 화면 (`widgets/home-panel`)

```
┌─────────────────────────────────┐
│  [🔍 장소, 주소 검색]     [📍]      │  ← 검색바 (탭하면 검색 화면 전환)
├─────────────────────────────────┤
│                                 │
│         [ 지도 영역 ]             │  ← Naver Maps (현재 위치 중심)
│                                 │
└─────────────────────────────────┘
```

- 검색바는 트리거 역할만 (탭하면 검색 화면 전환, 직접 입력 불가)
- 현재 위치 버튼(📍)으로 GPS 위치로 지도 이동
- MVP에서는 검색바 + 지도만 표시 (즐겨찾기/메뉴는 후속 기능)

#### 2-2. 검색 화면 (`widgets/search-panel`)

```
┌─────────────────────────────────┐
│  [←] [검색어 입력...]      [❌]    │  ← 뒤로가기
├─────────────────────────────────┤
│  🔍 힐스테이트                     │  ← 자동완성 결과 (입력 시 실시간)
│  🔍 힐스테이트롯데캐슬골드1단지         │
│  🔍 힐스테이트운정아파트              │
├─────────────────────────────────┤
│  📍 힐스테이트뉴포레아파트            │  ← 장소 결과 (주소 + 거리)
│     서울 관악구 조원로 25  702m     │
│  📍 힐스테이트관악센트씨엘            │
│     서울 관악구 은천로 25  1.2km    │
└─────────────────────────────────┘
```

- 입력 시: 자동완성 결과 실시간 표시 (300ms 디바운스)
- 장소 선택 시: 도착지로 설정 → 경로 탐색 화면 전환
- 뒤로가기(←) 또는 입력 초기화(❌): 홈 화면 복귀

#### 2-3. 경로 탐색 결과 화면 (`widgets/route-panel`)

```
┌─────────────────────────────────┐
│ [←] 서울특별시 구로구 디지...  [↕]    │  ← 출발지 (현재위치 자동)
│     힐스테이트관악센트씨엘            │  ← 도착지
├─────────────────────────────────┤
│                                 │
│     [ 경로가 표시된 지도 ]          │  ← 출발/도착 마커 + 경로 폴리라인
│                                 │
├─────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐       │
│ │ 추천      │ │ 대안 1    │       │  ← 경로 대안 카드 (가로 스크롤)
│ │ 16분     │ │ 18분      │       │
│ │ 오후2:25  │ │ 오후2:27  │       │
│ │ 6.2km    │ │ 6.8km    │       │
│ └──────────┘ └──────────┘       │
├─────────────────────────────────┤
│     [        안내시작        ]    │  ← CTA 버튼
└─────────────────────────────────┘
```

- 출발지: 현재 GPS 위치 자동 설정
- 도착지: 검색 화면에서 선택한 장소
- 경로 대안 카드: 가로 스크롤, 카드 탭 시 해당 경로 지도에 하이라이트
- 각 카드에 소요시간, 도착 예정시각, 거리 표시 (도착 예정시각은 `RouteResult.departureTime` 기준으로 계산된 문자열을 전달받음)
- 안내시작 버튼: 내비게이션 모드 진입
- 뒤로가기(←): 홈 화면 복귀

**구현 순서:**

8. **화면 상태 관리 업데이트**
   - `shared/store/uiStore.ts` — AppScreen 타입 추가 (`home` | `search` | `route` | `navigation`)
   - 화면 전환 로직: `setScreen(screen)`

9. **Place 엔티티 구현**
   - `entities/place/model/types.ts` — Place 타입
   - `entities/place/model/placeStore.ts` — 검색 상태 관리 (검색어, 결과, 선택된 장소)
   - `entities/place/ui/PlaceItem.tsx` — 장소 목록 아이템 컴포넌트
   - `entities/place/index.ts`

10. **검색 기능 구현**
    - 장소 검색 로직(디바운스 + fetch + AbortController)은 `widgets/search-panel/ui/SearchPanel.tsx`에 인라인
    - 별도 feature 슬라이스 없이 위젯에서 `entities/place/api/searchPlaces`를 직접 호출

11. **홈 화면 위젯**
    - `widgets/home-panel/ui/SearchBar.tsx` — 검색 트리거 바 (탭 시 검색 화면 전환)
    - `widgets/home-panel/ui/HomePanel.tsx` — 검색바 + 지도 조합
    - `widgets/home-panel/index.ts`

12. **검색 화면 위젯**
    - `widgets/search-panel/ui/SearchResults.tsx` — 자동완성 결과 목록
    - `widgets/search-panel/ui/SearchPanel.tsx` — 검색 input + 자동완성 결과 조합
    - `widgets/search-panel/index.ts`

13. **경로 탐색 결과 위젯**
    - `widgets/route-panel/ui/RouteHeader.tsx` — 출발지/도착지 표시 + 스왑
    - `widgets/route-panel/ui/RouteCard.tsx` — 경로 대안 카드
    - `widgets/route-panel/ui/RoutePanel.tsx` — 경로 화면 조합 (헤더 + 지도 + 카드 + CTA)
    - `widgets/route-panel/index.ts`

14. **페이지 뷰 조합**
    - `views/map/ui/MapPage.tsx` — AppScreen에 따라 홈/검색/경로/내비게이션 패널 전환
    - `app/page.tsx` — MapPage 렌더링

### Phase 3: GPS 추적

> Phase 2 완료 후. GPS 시뮬레이터 먼저 만들어 물리적 이동 없이 테스트.

15. `features/gps-tracking/model/useGeolocation.ts` — watchPosition 래핑
16. `features/gps-tracking/lib/kalmanFilter.ts` — KalmanFilter 클래스
17. `src/__dev__/gpsSimulator.ts` — 서울 도로 좌표 시퀀스 + 이탈 시나리오
18. `entities/position/ui/CurrentMarker.tsx` — 마커 + 애니메이션
19. `features/map-matching/model/useMapMatching.ts` — 배치 수집 + API 호출

### Phase 4: 경로 탐색 연동

20. `shared/api/osrm/routeService.ts` — Route API 클라이언트
21. `features/route-search/model/useRouteSearch.ts` — OSRM 경로 탐색 훅 (Phase 2 UI와 연결)
22. `entities/route/ui/RoutePolyline.tsx` — 경로 폴리라인
23. `features/route-search/ui/RouteAlternatives.tsx` — 대안 경로 지도 표시 연동
24. `entities/route/ui/RouteInfo.tsx` — 거리/시간 패널

**출발 시각(departureTime) 규칙:**

- OSRM API 응답을 `RouteResult`로 변환할 때 `departureTime: Date.now()`를 한 번만 캡처한다.
- `RouteResult.departureTime`은 도착 예정 시각 계산의 기준이 된다 (`departureTime + duration`).
- UI 컴포넌트(RouteCard 등)는 이미 계산된 문자열을 props로 받아 렌더링만 한다. 컴포넌트가 렌더링할 때마다 다른 결과를 반환하지 않도록 멱등성을 가지도록 설계한다.

### Phase 5: 턴바이턴 네비게이션

> Phase 4 완료 후. 경로 위에서 현재 step을 추적하고 회전 안내를 표시.
> 이탈 재탐색(Phase 6)보다 먼저 구현 — step 진행 상태가 이탈 판단의 기반이 됨.

**핵심 개념:**

- `activeRoute.steps[].maneuver.location` = 회전/방향전환이 발생하는 도로 위 좌표
- `filteredPosition`과 각 step의 `maneuver.location` 간 거리를 실시간 비교하여 진행도 추적
- 다음 maneuver 지점에 접근하면 step 통과 → 그 다음 안내로 전환

**안내 흐름:**

```
매 filteredPosition 갱신
  → distanceBetween(filteredPosition, nextStep.maneuver.location)
  → 임계값(30m) 이내? → currentStepIndex++ (step 통과)
  → UI 갱신: "300m 후 좌회전" → "좌회전" → "500m 후 우회전"
  → 마지막 step(arrive) 도달 → 안내 종료
```

**구현 순서:**

25. **Navigation 상태 확장**
    - `entities/route/model/types.ts` — `NavigationState` 타입 추가 (`currentStepIndex`, `distanceToNextManeuver`, `isNavigating`)
    - `entities/route/model/routeStore.ts` — navigation 상태 및 액션 추가

26. **Step 진행 추적 훅**
    - `features/turn-by-turn/model/useStepTracker.ts` — `filteredPosition` 변화 감지 → step 통과 판정
    - `features/turn-by-turn/lib/stepProgress.ts` — step 통과 판정 순수 함수 (거리 계산 + 접근/통과 판별)
    - `features/turn-by-turn/model/index.ts`, `features/turn-by-turn/lib/index.ts`

27. **Maneuver 한글 안내 변환**
    - `features/turn-by-turn/lib/maneuverInstruction.ts` — OSRM maneuver type+modifier → 한글 안내 문자열 매핑

28. **네비게이션 패널 UI**
    - `widgets/navigation-panel/ui/NavigationPanel.tsx` — 다음 회전 안내 + 남은 거리/시간
    - `widgets/navigation-panel/ui/ManeuverIcon.tsx` — 회전 방향 아이콘
    - `widgets/navigation-panel/ui/navigation-panel.module.scss`
    - `widgets/navigation-panel/ui/index.ts`

29. **MapPage 연동**
    - `views/map/ui/MapPage.tsx` — `navigation` 화면에서 NavigationPanel 렌더링
    - 안내시작 버튼 → `isNavigating: true` + GPS 추적 시작 + step 추적 시작

**네비게이션 화면 구성:**

```
┌─────────────────────────────────┐
│  [↰ 좌회전]           300m     │  ← 다음 회전 안내 (아이콘 + 거리)
│  종로                          │  ← 다음 도로명
├─────────────────────────────────┤
│                                 │
│         [ 지도 영역 ]           │  ← 경로 폴리라인 + 현재 위치 마커
│                                 │
├─────────────────────────────────┤
│  도착 14:25  │  12분  │  4.2km  │  ← 도착예정 / 남은시간 / 남은거리
│         [    안내종료    ]      │
└─────────────────────────────────┘
```

### Phase 6: 경로 이탈 + 재탐색

30. `features/route-deviation/lib/deviationDetector.ts` — 이탈 감지 로직
31. `features/route-deviation/model/useRouteDeviation.ts` — 재탐색 트리거
32. `features/route-deviation/ui/RerouteNotice.tsx` — 재탐색 UI
33. GPS 시뮬레이터로 전체 시나리오 통합 검증

---

## 향후 아이디어

### 실시간 교통 정보 — 경로 엔진 토글

MVP에서는 OSRM(교통 미반영)으로 경로를 탐색하지만, 추후 TMAP 경로 API를 추가하여 실시간 교통 정보가 반영된 경로를 제공한다.

**방식:**

- 경로 탐색 화면에 "실시간 교통 반영" 토글 버튼 추가
- 토글 OFF (기본): OSRM으로 경로 탐색 — 무료, 빠름, 교통 미반영
- 토글 ON: TMAP 경로 API로 경로 탐색 — 무료(일 제한), 실시간 교통 반영

**참고:**

- OSRM 경로 위에 교통 데이터를 얹는 방식은 불가 — 교통 반영은 경로 자체를 다시 계산해야 하므로 엔진 전환이 필요
- TMAP API는 서버 간 호출 — Next.js API Route 프록시 필요
- 폴링 주기: 30초~1분 (실시간 교통 데이터 갱신 주기에 맞춤)
