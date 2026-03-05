# 🛣️ Kroad

웹 기반 실시간 네비게이션 서비스

무료/저비용 오픈소스 인프라를 활용하여 GPS 추적, 경로 탐색, 경로 이탈 재탐색 기능을 제공합니다.

---

## 주요 기능

**실시간 GPS 추적** — 칼만 필터로 GPS 노이즈를 제거하고, OSRM Map Matching으로 마커를 도로 위에 정확히 표시합니다.

**경로 탐색** — 출발지와 도착지를 설정하면 OSRM 엔진이 최적 경로를 계산하고, 대안 경로를 최대 3개까지 제공합니다.

**경로 이탈 재탐색** — 안내 경로에서 50m 이상 벗어나면 자동으로 새 경로를 계산합니다.

---

## 기술 스택

| 구분       | 기술                               |
| ---------- | ---------------------------------- |
| 프레임워크 | Next.js 15+ (App Router)           |
| 언어       | TypeScript                         |
| 상태관리   | Zustand                            |
| 스타일링   | Tailwind CSS + SCSS Modules        |
| 지도       | Naver Maps JavaScript API v3       |
| 경로 엔진  | OSRM (Open Source Routing Machine) |
| 아키텍처   | FSD (Feature-Sliced Design)        |

---

## 시작하기

### 사전 요구사항

- Node.js 22+ (LTS)
- Docker Desktop
- Naver Cloud Platform 계정 ([Maps API 클라이언트 ID 발급](https://console.ncloud.com/naver-service/application))

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/kwonjihyeon-dev/kroad.git
cd kroad
pnpm install
```

### 2. OSRM 서버 실행

별도 저장소의 OSRM 서버가 필요합니다. [kroad-osrm](https://github.com/kwonjihyeon-dev/kroad-osrm)을 참고하세요.

### 3. 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

---

## 프로젝트 구조

[FSD (Feature-Sliced Design)](https://feature-sliced.design/) 아키텍처를 적용하고 있습니다.

```
kroad/
├── app/         ← Next.js App Router (layout, page)
└── src/         ← FSD 레이어 (비즈니스 로직)
    ├── app/     ← FSD app 레이어 (조합/구성)
    ├── views/        # 페이지 컴포지션
    ├── widgets/      # 독립 UI 블록 (지도, 검색 패널, 안내 패널)
    ├── features/     # 사용자 시나리오 (GPS 추적, 경로 탐색, 이탈 감지)
    ├── entities/     # 비즈니스 엔티티 (위치, 경로, 목적지)
    └── shared/       # 공용 유틸, API 클라이언트, 상수, 컴포넌트
```

레이어 의존성: `app → views → widgets → features → entities → shared`

상위 레이어에서 하위 레이어만 import 가능하며, `eslint-plugin-boundaries`로 자동 강제됩니다.

---

## 스크립트

```bash
pnpm dev        # 개발 서버
pnpm build      # 프로덕션 빌드
pnpm lint       # ESLint (FSD 규칙 포함)
pnpm format     # Prettier (import 정렬 포함)
```

---
