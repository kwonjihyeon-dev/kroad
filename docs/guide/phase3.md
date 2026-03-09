# Phase 3 구현 가이드 — GPS 추적

## 개요

브라우저 Geolocation API로 GPS 좌표를 수집하고, 칼만 필터로 노이즈를 제거한 뒤,
OSRM Map Matching API로 도로 위에 스냅하여 현재 위치 마커를 표시하는 전체 파이프라인을 설명한다.

---

## 1. GPS 처리 파이프라인

```
브라우저 Geolocation API (watchPosition, 좌표 변경 시 이벤트 발생)
  │
  ▼
useGeolocation ─── onPosition 콜백 ───┐
                                      │
                                      ▼
                               useGpsTracking (오케스트레이션)
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                  gpsStore에      칼만 필터      onPosition
                  rawPosition     적용           콜백 호출
                  저장            (useKalmanFilter)
                         │            │            │
                         │            ▼            ▼
                         │     gpsStore에      mapMatching
                         │     filteredPosition .addPosition()
                         │     저장 (isSnapped=false)
                         │                         │
                         │                    5초마다 배치
                         │                         │
                         │                         ▼
                         │                  OSRM Match API
                         │                         │
                         │                         ▼
                         │                  gpsStore에
                         │                  filteredPosition
                         │                  갱신 (isSnapped=true)
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                               CurrentMarker
                               (지도 위 마커)
```

---

## 2. 각 모듈 상세 설명

### 2-1. useGeolocation — 브라우저 GPS 래핑

**파일**: `features/gps-tracking/model/useGeolocation.ts`

브라우저 `navigator.geolocation.watchPosition`을 React 훅으로 래핑한다.

```typescript
useGeolocation(onPosition: GeolocationCallback, enabled: boolean)
```

- `enabled`가 `true`이면 `watchPosition` 시작, `false`이면 `clearWatch`
- GPS 설정은 `GPS_CONFIG`에서 주입:

| 설정 | 값 | 의미 |
| --- | --- | --- |
| `HIGH_ACCURACY` | `true` | GPS 칩 사용 (Wi-Fi만 쓰는 저정밀 모드 방지) |
| `MAX_AGE` | `0` | 캐시된 좌표 사용 금지 (항상 최신 좌표 요구) |
| `TIMEOUT` | `10000` | 10초 내 응답 없으면 오류 |

**watchPosition vs 시뮬레이터 — 호출 주기 차이:**

| | `watchPosition` (실제 GPS) | `gpsSimulator` (개발 테스트) |
| --- | --- | --- |
| **트리거 방식** | 이벤트 기반 — 좌표가 변경되면 콜백 호출 | `setInterval` — 고정 주기 폴링 |
| **호출 빈도** | 기기/OS/GPS 신호에 따라 가변 (모바일에서 대략 1초 전후이지만 보장되지 않음) | 정확히 `WATCH_INTERVAL`(1000ms) 간격 |
| **(실제) 신호 정지 시** | 콜백 미호출 → `batchRef` 미적재 → `batch.length < 2` 가드로 API 호출 없음 | 시뮬레이터 상 정지하는 구간이 없기 때문에 1초마다 발생해도 무방 |
| **좌표 수** | 이동 속도, 신호 품질에 따라 불규칙 | 시나리오에 정의된 좌표 수만큼 정확히 발행 |

이 차이 때문에 실제 환경에서는 `BATCH_INTERVAL`(5초) 동안 누적되는 좌표 수가 시뮬레이터와 다를 수 있다. Map Matching의 `processBatch`는 좌표가 2개 미만이면 무시하므로, 정지 상태에서 불필요한 API 호출이 발생하지 않는다.

**주의**: Geolocation API는 HTTPS 또는 localhost에서만 동작한다.

### 2-2. KalmanFilter — 노이즈 제거

**파일**: `features/gps-tracking/lib/kalmanFilter.ts`

1D(1차원) 칼만 필터 클래스. 숫자 하나를 입력받아 하나를 반환하는 구조이므로, lat과 lng에 각각 독립된 인스턴스를 만들어 따로 필터링한다. 2D 필터처럼 lat-lng 간 상관관계(이동 방향 등)는 고려하지 않지만, GPS 노이즈 제거 용도로는 충분하다.

**동작 원리:**

```
GPS가 보고한 좌표 (노이즈 포함)
  │
  ▼
[예측 단계] 오차 공분산 증가
  predictedCovariance = errorCovariance + processNoise
  │
  ▼
[칼만 이득 계산] 예측값과 측정값 중 어느 쪽을 더 신뢰할지 결정
  kalmanGain = predictedCovariance / (predictedCovariance + measurementNoise)
  │
  ▼
[보정] 예측값과 측정값의 가중평균
  estimate = estimate + kalmanGain * (measurement - estimate)
```

**파라미터 튜닝:**

| 파라미터 | 기본값 | 역할 |
| --- | --- | --- |
| `processNoise` | `0.01` | 값이 클수록 측정값(GPS)을 더 신뢰 → 반응 빠르지만 떨림 |
| `measurementNoise` | `3` | 값이 클수록 측정값을 덜 신뢰 → 부드럽지만 지연 |

현재 설정(`0.01` / `3`)은 GPS 정확도 3~15m 환경에서 안정적으로 동작하도록 튜닝된 값이다.
중요한 것은 각 값의 절대값이 아니라 `processNoise / measurementNoise` 비율(≈ 0.003)이며,
이 비율이 작을수록 스무딩이 강해진다.

**가중평균 변화 과정 예시:**

정지 상태에서 GPS가 떨리는 좌표 5개를 필터에 통과시킨 결과:

```
입력(GPS):   37.56650  37.56653  37.56648  37.56655  37.56647
                        (+3m)     (-5m)     (+7m)     (-8m)

1회차: 37.56650 (첫 측정, 그대로 수용)
  → estimate = 37.56650, errorCovariance = 1

2회차: GPS = 37.56653 (+3m 튐)
  → predictedCovariance = 1 + 0.01 = 1.01
  → kalmanGain = 1.01 / (1.01 + 3) = 0.252 (GPS 25.2% 반영)
  → estimate = 37.56650 + 0.252 × 0.00003 = 37.566508 (+3m 튐을 +0.8m만 반영)
  → errorCovariance = 0.756

3회차: GPS = 37.56648 (-5m 튐)
  → kalmanGain = 0.766 / 3.766 = 0.203 (GPS 20.3% 반영)
  → estimate = 37.566502 (-5m 튐을 -0.6m만 반영)
  → errorCovariance = 0.610

4회차: GPS = 37.56655 (+7m 튐)
  → kalmanGain = 0.620 / 3.620 = 0.171 (GPS 17.1% 반영)
  → estimate = 37.566510 (+7m 튐을 +0.8m만 반영)
  → errorCovariance = 0.514

5회차: GPS = 37.56647 (-8m 튐)
  → kalmanGain = 0.524 / 3.524 = 0.149 (GPS 14.9% 반영)
  → estimate = 37.566504 (-8m 튐을 -0.6m만 반영)
  → errorCovariance = 0.446

필터 출력:  37.56650  37.56651  37.56650  37.56651  37.56650
GPS 반영률: 100%      25.2%     20.3%     17.1%     14.9%
                       ↓ 시간이 지날수록 GPS를 덜 신뢰 → 떨림 억제 강화
```

GPS는 ±8m까지 튀지만, 필터 출력은 ±1m 이내로 안정된다.
`kalmanGain`이 회차마다 줄어들면서 기존 추정값을 점점 더 신뢰하는 방향으로 수렴한다.

**useKalmanFilter 훅**: `features/gps-tracking/model/useKalmanFilter.ts`

```typescript
const { filter, reset } = useKalmanFilter();

// lat, lng 각각 독립된 KalmanFilter 인스턴스로 필터링
const filtered: FilteredPosition = filter(rawGpsPosition);
// filtered.isSnapped = false (칼만 필터만 거친 상태, 아직 도로 스냅 전)
```

`useRef`로 필터 인스턴스를 유지하여 리렌더링 간 상태가 보존된다.

### 2-3. useGpsTracking — 오케스트레이션 훅

**파일**: `features/gps-tracking/model/useGpsTracking.ts`

GPS 추적의 전체 흐름을 조합하는 중앙 훅이다.

```typescript
const { isTracking, start, stop } = useGpsTracking({
  onPosition: addPosition, // Map Matching 배치 수집용 콜백
});
```

**내부 흐름:**

1. `useGeolocation`으로 GPS 좌표 수신
2. `gpsStore.updateRawPosition()` → 원시 좌표 저장
3. `useKalmanFilter().filter()` → 노이즈 제거
4. `gpsStore.updateFilteredPosition()` → 칼만 필터링된 좌표 저장
5. `options.onPosition()` → 외부 콜백 호출 (Map Matching 등)

**설계 포인트**: Map Matching은 `onPosition` 콜백으로 주입받는다. GPS 추적 훅이 Map Matching에 직접 의존하지 않으므로 FSD 레이어 규칙을 위반하지 않는다 (같은 features 레이어 간 cross-import 방지).

### 2-4. useMapMatching — 배치 수집 + 도로 스냅

**파일**: `features/map-matching/model/useMapMatching.ts`

```typescript
const { addPosition, start, stop } = useMapMatching();
```

| 함수 | 역할 |
| --- | --- |
| `addPosition(pos)` | GPS 좌표를 `batchRef` 배열에 누적 |
| `start()` | 5초 간격 타이머 시작 (`BATCH_INTERVAL`) |
| `stop()` | 타이머 정리 + 배치 초기화 |

**배치 처리 흐름 (processBatch):**

1. `batchRef`에 누적된 좌표가 2개 미만이면 무시
2. 좌표 배열 + 타임스탬프를 OSRM Match API에 전송
3. 응답의 **마지막 tracepoint**만 사용 (= 가장 최근 위치의 도로 스냅 좌표)
4. `gpsStore.updateFilteredPosition()` 호출 → `isSnapped: true`로 갱신

**왜 마지막 tracepoint만 사용하는가:**

OSRM Match API는 입력된 모든 좌표에 대해 스냅 결과를 반환하지만, 네비게이션에서 필요한 것은 **현재 위치**뿐이다. 과거 좌표의 스냅 결과는 이미 지나간 위치이므로 UI에 반영할 필요가 없다.

### 2-5. CurrentMarker — 지도 위 현재 위치 마커

**파일**: `entities/position/ui/CurrentMarker.tsx`

```typescript
<CurrentMarker position={filteredPosition} />
```

- `filteredPosition` 변경 시 `marker.setPosition()` 호출
- 파란 원형 마커 (18px, `#4A90D9`, 흰 테두리)
- `box-shadow`로 GPS 신호 느낌 표현
- `naver.maps.Marker`의 커스텀 `icon.content`로 HTML 마커 구현

---

## 3. 좌표 타입의 변화 과정

```
[GpsPosition]              브라우저 원시 좌표
  { lat, lng, accuracy, heading, speed, timestamp }
       │
       ▼ 칼만 필터
[FilteredPosition]         노이즈 제거 좌표
  { lat, lng, raw, isSnapped: false }
       │
       ▼ OSRM Map Matching
[FilteredPosition]         도로 스냅 좌표
  { lat, lng, raw, isSnapped: true }
```

- `raw` 필드에 원본 `GpsPosition`이 항상 보존된다
- `isSnapped`으로 칼만 필터만 거친 좌표와 도로 스냅된 좌표를 구분할 수 있다

---

## 4. 스토어 상태

`gpsStore`에 저장되는 핵심 상태:

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `rawPosition` | `GpsPosition \| null` | 브라우저 원시 GPS 좌표 |
| `filteredPosition` | `FilteredPosition \| null` | 칼만 필터 또는 도로 스냅된 좌표 (가장 최근). `stopTracking` 시에도 유지된다 |
| `isTracking` | `boolean` | GPS 추적 활성화 여부 |
| `positionHistory` | `FilteredPosition[]` | 최근 20개 필터링 좌표 이력 (슬라이딩 윈도우) |

`positionHistory`는 `.slice(-GPS_CONFIG.HISTORY_SIZE)`로 최근 20개만 유지하는 슬라이딩 윈도우다.

**20개를 유지하는 이유:**

- **Map Matching 입력 데이터 확보** — OSRM Match API는 연속된 복수 좌표를 받아야 지금 위치 근처에 있는 여러 후보 도로 중 내가 있는 도로를 정확하게 스냅할 수 있다. 20개 ≈ 약 20초분의 이동 궤적으로 충분한 컨텍스트를 확보한다.
- **메모리 무한 증가 방지** — 좌표가 계속 쌓이면 장시간 사용 시 메모리가 증가한다. `.slice(-20)`으로 오래된 데이터를 자동 제거한다.
- **경로 이탈 판단 근거** — 최근 N개의 위치가 경로로부터 일정 거리 이상 벗어났는지 연속 판단하는 데 이 이력이 활용된다.

---

## 5. GPS 시뮬레이터 (개발 전용)

**파일**: `src/__dev__/gpsSimulator.ts`, `src/__dev__/GpsTestPanel.tsx`

물리적 이동 없이 GPS 추적을 테스트하기 위한 시뮬레이터.

### 시나리오

| 이름 | 설명 |
| --- | --- |
| `normal` | 세종대로 → 테헤란로 정상 주행 (15개 좌표) |
| `noisy` | 정상 좌표에 랜덤 오차(3~15m) 추가 — 칼만 필터 효과 확인용 |
| `deviation` | 정상 5개 좌표 후 50m+ 이탈 — 경로 이탈 감지 테스트용 |

### 동작 방식

```typescript
gpsSimulator.setScenario('normal');
gpsSimulator.start((position) => {
  // GPS_CONFIG.WATCH_INTERVAL(1초) 간격으로 콜백 호출
  // 미리 정의된 좌표 시퀀스를 순서대로 발행
});
```

- `setInterval`로 `WATCH_INTERVAL`(1초) 간격으로 좌표 발행
- 시나리오의 모든 좌표를 발행하면 자동 중지
- `GpsTestPanel`에서 시나리오 선택 + 시작/중지 + Raw/Filtered 좌표 확인 가능

### GpsTestPanel UI

화면 우하단 고정 패널:
- 시나리오 드롭다운 선택
- 시뮬레이션 시작/중지 버튼
- Raw GPS 좌표 실시간 표시
- Filtered 좌표 + Snapped 여부 실시간 표시

---

## 6. 설정 상수 요약

```typescript
// shared/config/gps.ts
GPS_CONFIG = {
  WATCH_INTERVAL: 1000,   // GPS 수집 주기 (ms) — ~1초마다 좌표 수신
  BATCH_INTERVAL: 5000,   // Map Matching 배치 주기 (ms) — 5초마다 API 호출
  HISTORY_SIZE: 20,        // positionHistory 슬라이딩 윈도우 크기
  HIGH_ACCURACY: true,     // GPS 칩 사용 (고정밀 모드)
  MAX_AGE: 0,              // 캐시된 좌표 사용 금지
  TIMEOUT: 10000,          // GPS 응답 타임아웃 (ms)
}
```

---

## 7. 관련 파일 목록

| 파일 | 역할 |
| --- | --- |
| `features/gps-tracking/model/useGeolocation.ts` | 브라우저 watchPosition 래핑 |
| `features/gps-tracking/model/useKalmanFilter.ts` | 칼만 필터 훅 (lat, lng 독립 필터링) |
| `features/gps-tracking/model/useGpsTracking.ts` | GPS 추적 오케스트레이션 |
| `features/gps-tracking/lib/kalmanFilter.ts` | KalmanFilter 클래스 (순수 로직) |
| `features/map-matching/model/useMapMatching.ts` | 배치 수집 + OSRM Match API 호출 |
| `entities/position/model/gpsStore.ts` | GPS 상태 스토어 |
| `entities/position/model/types.ts` | GpsPosition, FilteredPosition 타입 |
| `entities/position/ui/CurrentMarker.tsx` | 현재 위치 마커 컴포넌트 |
| `shared/api/osrm/matchService.ts` | OSRM Match API 클라이언트 |
| `shared/config/gps.ts` | GPS 설정 상수 |
| `src/__dev__/gpsSimulator.ts` | GPS 시뮬레이터 클래스 |
| `src/__dev__/GpsTestPanel.tsx` | 시뮬레이터 UI 패널 |

---

## 8. FSD 의존성 흐름

```
[widgets]  GpsTestPanel(개발전용)
              │
              ├─ useGpsTracking ◄── [features/gps-tracking]
              │       │
              │       ├─ useGeolocation (내부)
              │       ├─ useKalmanFilter (내부) → KalmanFilter [lib]
              │       └─ gpsStore [entities/position]
              │
              └─ useMapMatching ◄── [features/map-matching]
                      │
                      ├─ matchCoordinates [shared/api/osrm]
                      └─ gpsStore [entities/position]
```

- `features/gps-tracking`과 `features/map-matching`은 같은 레이어이므로 서로 직접 import하지 않는다
- 조합은 상위 레이어(widgets 또는 views)에서 `onPosition` 콜백 패턴으로 연결한다
