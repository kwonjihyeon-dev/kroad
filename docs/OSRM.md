# OSRM (Open Source Routing Machine) 백엔드

## 개요

Google Maps API의 무료 대안으로, 두 지점 간 경로 탐색(거리, 소요시간, 경로 좌표)을 제공하는 오픈소스 라우팅 엔진.
OpenStreetMap(OSM) 한국 지도 데이터를 기반으로 Docker 위에서 구동된다.

## 기술 스택

- **OSRM Backend**: C++ 기반 라우팅 엔진
- **Docker**: 컨테이너 환경 (Apple Silicon Mac에서 `linux/amd64` 호환 모드 사용)
- **OpenStreetMap**: Geofabrik에서 제공하는 한국 지도 데이터 (south-korea-latest.osm.pbf)

## 레포지토리 위치

- GitHub: `https://github.com/kwonjihyeon-dev/kroad-osrm.git`
- 로컬: `/Users/macbook/Desktop/code/osrm-korea`

## 서버 정보

| 항목      | 값                          |
| --------- | --------------------------- |
| 호스트    | `http://localhost:5001`     |
| 포트 매핑 | 호스트 5001 → 컨테이너 5000 |
| 알고리즘  | MLD (Multi-Level Dijkstra)  |
| 프로필    | car.lua (자동차 경로)       |

> 5000번 포트는 Mac의 AirPlay 수신 모드가 점유하고 있어 5001번을 사용한다.

## 서버 실행 / 종료

```bash
# osrm-korea 폴더에서
docker compose up -d    # 서버 시작 (백그라운드)
docker compose down     # 서버 종료
docker compose logs     # 로그 확인
```

## 초기 환경 구축 (최초 1회)

새로운 개발 환경에서 처음 세팅할 때만 실행한다.

```bash
git clone https://github.com/kwonjihyeon-dev/kroad-osrm.git
cd kroad-osrm
chmod +x setup.sh
./setup.sh              # 지도 다운로드 + 전처리 (20~40분 소요)
docker compose up -d
```

## API 엔드포인트

### 1. Route (경로 탐색)

두 지점 간 최적 경로를 반환한다.

```
GET http://localhost:5001/route/v1/driving/{경도1},{위도1};{경도2},{위도2}
```

**좌표 순서: 경도(longitude), 위도(latitude) — 일반적인 위도/경도 순서와 반대임에 주의**

**파라미터:**

- `steps=true`: 상세 경로 안내 포함
- `overview=full`: 전체 경로 폴리라인 포함
- `geometries=geojson`: GeoJSON 형식으로 좌표 반환
- `alternatives=true`: 대안 경로 포함

**예시: 서울역 → 강남역**

```
GET http://localhost:5001/route/v1/driving/126.9726,37.5560;127.0276,37.4979?steps=true&overview=full&geometries=geojson
```

**응답 주요 필드:**

```json
{
  "routes": [{
    "distance": 12345.6,       // 총 거리 (미터)
    "duration": 1234.5,        // 총 소요시간 (초)
    "geometry": { ... },       // 경로 좌표 (GeoJSON)
    "legs": [{
      "steps": [{ ... }]      // 구간별 상세 안내
    }]
  }]
}
```

### 2. Match (맵 매칭)

GPS 좌표들을 실제 도로 위에 정렬(스냅)한다. GPS 노이즈 제거에 유용.

```
GET http://localhost:5001/match/v1/driving/{경도1},{위도1};{경도2},{위도2};...
```

**파라미터:**

- `timestamps={t1};{t2};...`: 각 좌표의 Unix 타임스탬프
- `radiuses={r1};{r2};...`: 각 좌표의 GPS 오차 반경 (미터)
- `geometries=geojson`: GeoJSON 형식 반환
- `overview=full`: 전체 경로 반환

**예시:**

```
GET http://localhost:5001/match/v1/driving/126.9726,37.5560;126.9730,37.5555;126.9740,37.5545?timestamps=1609459200;1609459205;1609459210&radiuses=10;10;10&geometries=geojson
```

### 3. Nearest (가장 가까운 도로 찾기)

GPS 좌표에서 가장 가까운 도로 지점을 반환한다.

```
GET http://localhost:5001/nearest/v1/driving/{경도},{위도}
```

### 4. Table (거리/시간 행렬)

여러 지점 간 거리/시간을 행렬로 반환한다.

```
GET http://localhost:5001/table/v1/driving/{경도1},{위도1};{경도2},{위도2};{경도3},{위도3}
```

## 프론트엔드 연동 예시 (TypeScript + Tanstack Query)

```typescript
// types/osrm.ts
interface OSRMRoute {
  distance: number; // 미터
  duration: number; // 초
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [경도, 위도][]
  };
}

interface OSRMResponse {
  code: string; // 'Ok' 이면 성공
  routes: OSRMRoute[];
}

// hooks/useRoute.ts
const OSRM_BASE_URL =
  process.env.NEXT_PUBLIC_OSRM_URL || "http://localhost:5001";

const fetchRoute = async (
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
): Promise<OSRMResponse> => {
  const res = await fetch(
    `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?steps=true&overview=full&geometries=geojson`,
  );
  if (!res.ok) throw new Error("OSRM 경로 조회 실패");
  return res.json();
};
```

## 환경변수

프론트엔드 프로젝트의 `.env.local`에 추가:

```env
NEXT_PUBLIC_OSRM_URL=http://localhost:5001
```

## 주의사항

1. **좌표 순서**: OSRM은 `경도,위도` 순서 (일반적인 `위도,경도`와 반대)
2. **서버 선행 실행**: 프론트엔드 개발 전에 `docker compose up -d` 로 OSRM 서버를 먼저 띄워야 함
3. **Apple Silicon**: `platform: linux/amd64` 호환 모드로 동작하며 Intel Mac 대비 다소 느릴 수 있음
4. **데이터 갱신**: 지도 데이터를 업데이트하려면 `rm -f south-korea-latest.*` 로 기존 파일 삭제 후 `./setup.sh` 재실행 필요
5. **프로덕션**: 실서비스에서는 별도 서버(EC2 등)에 OSRM을 배포해야 함
