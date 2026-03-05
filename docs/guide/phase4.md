# Phase 4 구현 가이드 — 경로 탐색 연동

## 개요

출발지와 목적지를 OSRM Route API로 탐색하고, 응답을 파싱하여
지도 위에 폴리라인으로 렌더링하고, 경로 요약 정보를 표시하는 전체 과정을 설명한다.

---

## 1. 경로 탐색 데이터 흐름

```
사용자가 장소 선택 (검색 화면)
  │
  ▼
routeStore에 origin/destination 저장
  │
  ▼
useRouteSearch (origin, destination 변화 감지)
  │
  ▼
fetchRoute() — OSRM Route API 호출
  │
  GET /route/v1/driving/{lng1},{lat1};{lng2},{lat2}
      ?overview=full&geometries=polyline&alternatives=true&steps=true
  │
  ▼
OSRM 응답 수신
  │
  ├─ routes[0] → toRouteResult() → routeStore.activeRoute
  └─ routes[1..N] → toRouteResult() → routeStore.alternativeRoutes
  │
  ▼
UI 렌더링
  ├─ RouteAlternatives → RoutePolyline (지도 위 경로선)
  └─ RouteInfo → 소요시간, 거리, 도착 예정 시각
```

---

## 2. 각 모듈 상세 설명

### 2-1. fetchRoute — OSRM Route API 클라이언트

**파일**: `shared/api/osrm/routeService.ts`

```typescript
export async function fetchRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<OsrmRouteResponse>
```

- `toOsrmCoord()`로 `{ lat, lng }` → `"lng,lat"` 변환 (OSRM은 경도가 먼저)
- `osrmApi`는 `HttpClient` 인스턴스로, `NEXT_PUBLIC_OSRM_BASE_URL` 환경 변수를 baseURL로 사용

**쿼리 파라미터:**

| 파라미터 | 값 | 의미 |
| --- | --- | --- |
| `overview` | `full` | 전체 경로 geometry 반환 (simplified가 아닌 상세 좌표) |
| `geometries` | `polyline` | Google Encoded Polyline 형식으로 반환 |
| `alternatives` | `true` | 대안 경로도 함께 반환 |
| `steps` | `true` | 각 구간별 회전 정보(maneuver) 포함 |

### 2-2. useRouteSearch — 경로 탐색 훅

**파일**: `features/route-search/model/useRouteSearch.ts`

```typescript
export function useRouteSearch(origin: Coordinate | null, destination: Coordinate | null)
```

`origin`과 `destination`이 모두 존재하면 자동으로 경로 탐색을 실행한다.
`useEffect`의 의존성 배열에 두 좌표가 있으므로, 출발지나 도착지가 변경되면 재탐색된다.

**내부 흐름:**

1. `fetchRoute(origin, destination)` 호출
2. 응답의 `routes[0]`을 `activeRoute`로, 나머지를 `alternativeRoutes`로 저장
3. 각 route를 `toRouteResult()`로 변환

**경쟁 조건 방지:**

```typescript
let cancelled = false;

async function search() {
  const response = await fetchRoute(origin!, destination!);
  if (cancelled) return; // 이전 요청 결과 무시
  // ...
}

search();
return () => { cancelled = true; };
```

`useEffect`의 cleanup 함수로 `cancelled` 플래그를 설정한다.
출발지/도착지가 빠르게 변경될 때, 이전 요청의 응답이 뒤늦게 도착해도 스토어를 덮어쓰지 않는다.

### 2-3. toRouteResult — OSRM 응답 → 내부 타입 변환

```typescript
function toRouteResult(route: OsrmRoute, departureTime: number): RouteResult
```

OSRM 응답을 프로젝트 내부 타입으로 변환하는 순수 함수.

**변환 과정:**

```
OsrmRoute                          RouteResult
├─ geometry: "encoded_string"  →   geometry: Coordinate[] (decodePolyline)
├─ duration: 1234.5            →   duration: 1234.5 (그대로)
├─ distance: 15000.2           →   distance: 15000.2 (그대로)
├─ legs[].steps[]              →   steps: RouteStep[] (flatMap)
│   └─ maneuver.location:         └─ maneuver.location:
│      [126.978, 37.566]              { lat: 37.566, lng: 126.978 }
│      (OSRM: lng,lat 순서)           (fromOsrmLocation으로 변환)
└─                             →   departureTime: Date.now()
```

**좌표 순서 변환이 여기서 일어난다:**

OSRM은 `[lng, lat]`, 프로젝트는 `{ lat, lng }`. `fromOsrmLocation()`이 이 차이를 해소한다.
geometry는 `decodePolyline()`으로 인코딩된 문자열을 `Coordinate[]`로 디코딩한다.

### 2-4. departureTime — 멱등성 보장 설계

```typescript
const departureTime = Date.now(); // 탐색 시점에 한 번만 캡처
const [first, ...rest] = response.routes;

setActiveRoute(toRouteResult(first, departureTime));
setAlternativeRoutes(rest.map((r) => toRouteResult(r, departureTime)));
```

**왜 `Date.now()`를 한 번만 호출하는가:**

도착 예정 시각 = `departureTime + duration`. 만약 `RouteInfo` 컴포넌트가 렌더링할 때마다
`Date.now()`를 호출하면, 리렌더링될 때마다 도착 시각이 달라진다 (멱등하지 않음).

```
// 나쁜 예: 렌더링마다 다른 결과
const arrival = new Date(Date.now() + duration * 1000); // 리렌더링마다 변경

// 좋은 예: 탐색 시점 고정
const arrival = new Date(departureTime + duration * 1000); // 항상 같은 결과
```

`departureTime`을 `RouteResult`에 포함시켜 탐색 시점을 고정하고,
UI는 이 값을 받아 렌더링만 하므로 몇 번을 리렌더링해도 같은 결과를 보장한다.

---

## 3. 지도 렌더링

### 3-1. RoutePolyline — 경로선 컴포넌트

**파일**: `entities/route/ui/RoutePolyline.tsx`

```typescript
<RoutePolyline
  path={route.geometry}     // Coordinate[]
  color="#4A90D9"            // 선 색상
  width={6}                 // 선 두께
  opacity={1}               // 불투명도
  zIndex={10}               // 렌더링 순서
  onClick={() => { ... }}   // 클릭 이벤트 (선택)
/>
```

- `Coordinate[]` → `naver.maps.LatLng[]`로 변환하여 `naver.maps.Polyline` 생성
- 폴리라인이 이미 존재하면 `setOptions()`로 업데이트 (재생성 방지)
- 클릭 리스너도 props 변경 시 갱신
- 언마운트 시 `setMap(null)`로 지도에서 제거

**렌더링 반환값이 `null`인 이유:**

Naver Maps SDK는 DOM이 아니라 지도 캔버스 위에 직접 그린다.
React 컴포넌트는 `useEffect`로 SDK를 제어할 뿐, 실제 DOM 요소를 렌더링하지 않는다.

### 3-2. RouteAlternatives — 활성/대안 경로 조합

**파일**: `features/route-search/ui/RouteAlternatives.tsx`

활성 경로와 대안 경로를 함께 렌더링하고, 대안 경로 클릭 시 교체하는 컴포넌트.

```
지도 위 렌더링:
  ┌─ 대안 경로들: 회색(#CCCCCC), opacity 0.6, zIndex 1
  └─ 활성 경로:   파란색(#4A90D9), opacity 1, zIndex 10 (위에 표시)
```

**대안 경로 클릭 시 교체 로직:**

```typescript
const handleAlternativeClick = (index: number) => {
  const clicked = alternativeRoutes[index];     // 클릭한 대안
  const newAlternatives = [...alternativeRoutes];
  newAlternatives[index] = activeRoute;          // 기존 활성 → 대안으로 이동

  setActiveRoute(clicked);                       // 클릭한 대안 → 활성으로 승격
  setAlternativeRoutes(newAlternatives);
};
```

활성 경로와 클릭한 대안 경로를 스왑한다. 경로 데이터 자체는 변경되지 않고 위치만 교환된다.

---

## 4. 경로 요약 정보

### 4-1. RouteInfo — 거리/시간 패널

**파일**: `entities/route/ui/RouteInfo.tsx`

```typescript
<RouteInfo duration={route.duration} distance={route.distance} departureTime={route.departureTime} />
```

세 가지 포맷 함수로 OSRM 원시값을 사용자 친화적 문자열로 변환한다:

| 함수 | 입력 | 출력 예시 |
| --- | --- | --- |
| `formatDuration(seconds)` | `1234.5` (초) | `"21분"` 또는 `"1시간 30분"` |
| `formatDistance(meters)` | `15000.2` (미터) | `"15.0km"` 또는 `"800m"` |
| `formatArrivalTime(departureTime, duration)` | ms 타임스탬프, 초 | `"오후 2:25"` |

**formatArrivalTime 동작:**

```typescript
const arrival = new Date(departureTime + durationSeconds * 1000);
return arrival.toLocaleTimeString('ko-KR', {
  hour: 'numeric', minute: '2-digit', hour12: true,
});
```

`departureTime`(탐색 시점 고정값)에 `duration`을 더해 도착 시각을 계산한다.
`Date.now()`를 사용하지 않으므로 리렌더링해도 결과가 변하지 않는다.

---

## 5. Polyline 디코딩

**파일**: `shared/lib/coordinateUtils.ts`의 `decodePolyline()`

OSRM이 `geometries=polyline` 옵션으로 반환하는 인코딩된 문자열을 `Coordinate[]`로 변환한다.

**인코딩 형식**: Google Encoded Polyline Algorithm

```
인코딩된 문자열: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
                    ↓ decodePolyline()
Coordinate[]:    [{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, ...]
```

**왜 인코딩하는가:**

경로는 수백~수천 개의 좌표로 구성된다. JSON 배열로 전송하면 응답 크기가 크지만,
polyline 인코딩은 좌표 간 차이값(delta)을 압축하여 전송량을 대폭 줄인다.

---

## 6. 스토어 상태

`routeStore`에 저장되는 핵심 상태:

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `origin` | `Coordinate \| null` | 출발지 좌표 |
| `destination` | `Coordinate \| null` | 도착지 좌표 |
| `activeRoute` | `RouteResult \| null` | 현재 선택된 경로 |
| `alternativeRoutes` | `RouteResult[]` | 대안 경로 목록 |
| `deviation` | `DeviationState` | 경로 이탈 상태 (Phase 6에서 활용) |

`clearRoute()`는 모든 경로 상태를 초기화한다 (홈 화면 복귀 시 호출).

---

## 7. 좌표 순서 변환 요약

이 Phase에서 좌표 변환이 발생하는 두 지점:

| 변환 지점 | 함수 | 방향 |
| --- | --- | --- |
| API 요청 시 | `toOsrmCoord()` | `{ lat, lng }` → `"lng,lat"` (프로젝트 → OSRM) |
| API 응답 시 | `fromOsrmLocation()` | `[lng, lat]` → `{ lat, lng }` (OSRM → 프로젝트) |
| 지도 렌더링 시 | `new naver.maps.LatLng(lat, lng)` | `{ lat, lng }` → Naver Maps 객체 |

OSRM과 Naver Maps의 좌표 순서가 다르므로 반드시 변환 함수를 거쳐야 한다.
직접 `[0]`, `[1]` 인덱스로 접근하지 않고, `toOsrmCoord()`/`fromOsrmLocation()`을 사용한다.

---

## 8. 설정 상수

```typescript
// shared/config/map.ts
MAP_CONFIG = {
  POLYLINE_COLOR: '#4A90D9',       // 활성 경로 색상 (파란색)
  ALT_POLYLINE_COLOR: '#CCCCCC',   // 대안 경로 색상 (회색)
  POLYLINE_WIDTH: 6,               // 경로선 두께 (px)
}

// shared/config/route.ts
ROUTE_CONFIG = {
  MAX_ALTERNATIVES: 3,             // 대안 경로 최대 개수
}
```

---

## 9. 관련 파일 목록

| 파일 | 역할 |
| --- | --- |
| `shared/api/osrm/routeService.ts` | OSRM Route API 클라이언트 |
| `shared/api/osrm/types.ts` | OSRM 응답 타입 정의 |
| `shared/api/http.ts` | HttpClient 클래스 (`osrmApi` 인스턴스) |
| `features/route-search/model/useRouteSearch.ts` | 경로 탐색 훅 + 응답 변환 |
| `features/route-search/ui/RouteAlternatives.tsx` | 활성/대안 경로 지도 렌더링 |
| `entities/route/model/routeStore.ts` | 경로 상태 스토어 |
| `entities/route/model/types.ts` | RouteResult, RouteStep, DeviationState 타입 |
| `entities/route/ui/RoutePolyline.tsx` | 폴리라인 컴포넌트 |
| `entities/route/ui/RouteInfo.tsx` | 거리/시간/도착시각 표시 |
| `shared/lib/coordinateUtils.ts` | 좌표 변환, polyline 디코딩, 거리 계산 |
| `shared/lib/format.ts` | 거리/시간/도착시각 포맷팅 |
| `shared/config/map.ts` | 지도 설정 상수 |
| `shared/config/route.ts` | 경로 설정 상수 |
