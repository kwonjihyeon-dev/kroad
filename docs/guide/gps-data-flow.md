# GPS 데이터 흐름

## 전체 흐름도

```
브라우저 GPS (1초마다)
  │
  ▼
useGeolocation ── onPosition 콜백 ──┬──► gpsStore.updateRawPosition()
                                    │    (rawPosition에 저장 — 생 GPS)
                                    │
                                    └──► mapMatching.addPosition()
                                         (batchRef 배열에 누적)
                                              │
                                         5초마다 (BATCH_INTERVAL)
                                              │
                                         processBatch()
                                              │
                                              ▼
                                    matchCoordinates() ── OSRM Match API
                                              │
                                      응답의 마지막 tracepoint
                                              │
                                              ▼
                                    gpsStore.updateFilteredPosition()
                                         ├─ filteredPosition 갱신
                                         └─ positionHistory에 추가 (최대 20개)
```

## 각 단계별 설명

### 1단계: GPS 수집 (useGeolocation)

- `watchPosition`이 ~1초마다 브라우저 GPS 좌표를 콜백으로 전달
- `GpsPosition = { lat, lng, accuracy, heading, speed, timestamp }`

### 2단계: 배치 누적 (useMapMatching.addPosition)

- 받은 GPS 좌표를 `batchRef` 배열에 계속 쌓음
- 5초간 약 5개의 좌표가 모임

### 3단계: OSRM Map Matching (processBatch)

- 누적된 좌표 배열을 OSRM Match API에 전송
- OSRM이 각 좌표를 가장 가까운 도로 위로 스냅해서 반환

### 4단계: 스토어 갱신 (updateFilteredPosition)

```typescript
// 응답의 마지막 tracepoint만 사용 (= 가장 최근 위치)
const lastTracepoint = response.tracepoints[response.tracepoints.length - 1];

updateFilteredPosition({
  lat: snapped.lat,    // 도로 위 보정 좌표
  lng: snapped.lng,
  raw: lastRaw,        // 원본 GPS 좌표 보존
  isSnapped: true,     // 스냅 성공 여부
});
```

### 5단계: gpsStore 상태 업데이트

```typescript
updateFilteredPosition: (pos) =>
  set((state) => ({
    filteredPosition: pos,                                          // 현재 위치 갱신
    positionHistory: [...state.positionHistory, pos].slice(-20),    // 최근 20개 이력 유지
  })),
```

## 스토어에 저장되는 두 가지 좌표

| 필드 | 내용 | 용도 |
| --- | --- | --- |
| `rawPosition` | 브라우저 생 GPS 좌표 | 디버깅, 정확도 비교 |
| `filteredPosition` | OSRM 도로 스냅 좌표 | 지도 마커 표시, 경로 안내 판단에 사용 |

`filteredPosition`이 도로 위에 정확히 보정된 좌표이므로, 향후 경로 안내 step 진행 판단도 이 좌표 기준으로 수행한다.

## 관련 파일

- `src/entities/position/model/gpsStore.ts` - GPS 상태 스토어
- `src/features/map-matching/model/useMapMatching.ts` - 배치 수집 + OSRM Map Matching 훅
- `src/shared/config/gps.ts` - GPS 설정 상수 (WATCH_INTERVAL, BATCH_INTERVAL, HISTORY_SIZE)
- `src/shared/api/osrm/matchService.ts` - OSRM Match API 호출
