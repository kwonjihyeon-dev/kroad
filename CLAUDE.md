# CLAUDE.md — Kroad

## 프로젝트 개요

Kroad는 웹 기반 네비게이션 서비스다. 실시간 GPS 추적, 경로 탐색, 경로 이탈 재탐색 기능을 무료/저비용 인프라로 구현한다.

- 타겟: 모바일 웹 우선 (반응형)
- 경로 엔진: OSRM (Docker)
- 지도: Naver Maps JavaScript API v3

---

## 기술 스택

| 구분        | 기술                                           |
| ----------- | ---------------------------------------------- |
| 프레임워크  | Next.js 15+ (App Router)                       |
| 언어        | TypeScript (strict mode)                       |
| 상태관리    | Zustand (클라이언트) + TanStack Query (서버)   |
| 스타일링    | Tailwind CSS + SCSS Modules                    |
| 지도        | Naver Maps JavaScript API v3                   |
| 경로 엔진   | OSRM (Docker)                                  |
| 린트        | ESLint + eslint-plugin-boundaries              |
| import 정렬 | Prettier + @ianvs/prettier-plugin-sort-imports |

### 린트 / 포맷팅 역할 분담

- **Prettier** → import 순서 정렬 (보기 좋게 그룹핑)
- **ESLint boundaries** → import 방향 규칙 (FSD 위반 차단)
- 두 도구는 역할이 분리되어 충돌 없음

### 스타일링 분담 규칙

- **Tailwind**: 레이아웃, 간격, 반응형, 기본 타이포그래피, 상태(hover/focus)
- **SCSS Modules**: 지도 오버레이, 마커 커스텀, 복잡한 애니메이션, 테마 변수

---

## FSD 아키텍처 (Feature-Sliced Design)

### 레이어 의존성 규칙 (절대 위반 금지)

```
app → views → widgets → features → entities → shared
```

1. **상위 → 하위만 import 가능.** 역방향 절대 금지.
2. **같은 레이어 내 슬라이스 간 cross-import 금지.**
3. **외부에서 슬라이스 접근 시 반드시 index.ts를 통해서만.**

```
✅ widgets/map-view → features/gps-tracking
✅ features/route-search → entities/route
❌ entities/route → features/route-search (역방향)
❌ features/gps-tracking → features/route-deviation (같은 레이어)
❌ import from '@features/gps-tracking/lib/kalmanFilter' (내부 직접 접근)
✅ import from '@features/gps-tracking' (index.ts 통해)
```

### 디렉토리 구조 (Next.js + FSD 분리)

```
kroad/
├── app/         ← Next.js App Router (layout, page)
└── src/         ← FSD 레이어 (비즈니스 로직)
    ├── app/     ← FSD app 레이어 (조합/구성)
    ├── views/
    ├── widgets/
    ├── features/
    ├── entities/
    └── shared/
```

- `app/` (루트): Next.js 라우팅 전용 — layout.tsx, page.tsx, providers.tsx
- `src/app/`: FSD app 레이어 — 위젯 조합, 페이지 구성 로직

### 경로 별칭 (tsconfig paths)

```
@app/*       → src/app/*       (FSD app 레이어)
@views/*     → src/views/*
@widgets/*   → src/widgets/*
@features/*  → src/features/*
@entities/*  → src/entities/*
@shared/*    → src/shared/*
```

- **shared 레이어**: 직접 파일 import 허용 (`@shared/config/map`)
- **그 외 레이어**: 반드시 `index.ts`를 통해 import (`@features/gps-tracking`)

### 슬라이스 내부 세그먼트 구조

```
각 슬라이스/
├── model/     # 훅, 스토어, 비즈니스 로직
├── ui/        # 컴포넌트 + 스타일
├── lib/       # 순수 함수/클래스
├── api/       # 해당 슬라이스 전용 API
└── index.ts   # public API (외부 노출용 re-export만)
```

---

## ⚠️ 핵심 주의사항 (모든 Phase 공통)

### 좌표 순서 차이

- **OSRM**: `[경도(lng), 위도(lat)]` → API URL에 `{lng},{lat}` 순서
- **Naver Maps**: `new naver.maps.LatLng(lat, lng)` → `(위도, 경도)` 순서
- 변환 함수를 shared/lib/coordinateUtils.ts에 반드시 구현

### Naver Maps + Next.js SSR

- Naver Maps SDK는 `window` 객체 필요 → 클라이언트 사이드에서만 초기화
- `next/script` afterInteractive 전략 또는 `useEffect` 내 초기화
- 지도 관련 컴포넌트에 `'use client'` 디렉티브 필수

### HTTPS / GPS

- Geolocation API는 보안 컨텍스트(HTTPS 또는 localhost)에서만 동작
- 배포 시 SSL 필수

---

## 환경 변수

```env
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=your_client_id
NEXT_PUBLIC_OSRM_BASE_URL=http://localhost:5001
```

---

## OSRM API 레퍼런스

### Route API

```
GET {OSRM_BASE_URL}/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
    ?overview=full&geometries=polyline&alternatives=true&steps=true
```

### Map Matching API

```
GET {OSRM_BASE_URL}/match/v1/driving/{lng1},{lat1};{lng2},{lat2};...
    ?overview=full&geometries=polyline&radiuses=20;20;...&timestamps={t1};{t2};...
```

### 응답 핵심 필드

- `routes[].geometry` → 인코딩된 polyline (디코딩 필요)
- `routes[].duration` → 초 단위
- `routes[].distance` → 미터 단위
- `routes[].legs[].steps[].maneuver` → 회전 정보
- `tracepoints[].location` → [lng, lat] 도로 스냅 좌표

---

## 코딩 컨벤션

- 컴포넌트: PascalCase (`MapView.tsx`)
- 훅: camelCase + `use` 접두사 (`useGpsTracking.ts`)
- 스토어: camelCase + `Store` 접미사 (`gpsStore.ts`)
- 상수: UPPER_SNAKE_CASE (`DEVIATION_THRESHOLD`)
- SCSS 모듈: kebab-case (`map-view.module.scss`)
- 모든 컴포넌트와 훅에 JSDoc 주석 작성
- Naver Maps 관련 컴포넌트에 `'use client'` 디렉티브 필수

---

## 기능 기획 문서 위치

기능별 상세 스펙, 디렉토리 구조, Phase 실행 지침은 아래 문서를 참고한다.
새 기능 추가 시 `prd-{기능명}.md`를 생성한다.

```
docs/
├── prd-roadmap.md    ← MVP 기능 (GPS 추적, 경로 탐색, 이탈 재탐색)
├── prd-xxx.md        ← 향후 추가 기능
└── changelog.md      ← 변경 이력 (선택)
```
