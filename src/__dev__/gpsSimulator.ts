import type { GpsPosition } from '@entities/position/model';
import { GPS_CONFIG } from '@shared/config/gps';

/** GPS 시뮬레이터 시나리오 */
interface GpsScenario {
  name: string;
  positions: Omit<GpsPosition, 'timestamp'>[];
}

/** 세종대로 → 테헤란로 정상 주행 시나리오 */
const NORMAL_ROUTE: GpsScenario = {
  name: '정상 주행 (세종대로 → 테헤란로)',
  positions: [
    { lat: 37.5665, lng: 126.978, accuracy: 10, heading: 180, speed: 8.3 },
    { lat: 37.566, lng: 126.9785, accuracy: 8, heading: 170, speed: 8.5 },
    { lat: 37.5655, lng: 126.979, accuracy: 12, heading: 165, speed: 9.0 },
    { lat: 37.565, lng: 126.9795, accuracy: 7, heading: 160, speed: 8.8 },
    { lat: 37.5645, lng: 126.98, accuracy: 10, heading: 155, speed: 9.2 },
    { lat: 37.564, lng: 126.9808, accuracy: 9, heading: 140, speed: 8.6 },
    { lat: 37.5635, lng: 126.9818, accuracy: 11, heading: 130, speed: 9.1 },
    { lat: 37.563, lng: 126.983, accuracy: 8, heading: 120, speed: 8.7 },
    { lat: 37.5628, lng: 126.9845, accuracy: 10, heading: 100, speed: 9.5 },
    { lat: 37.5627, lng: 126.986, accuracy: 7, heading: 90, speed: 9.8 },
    { lat: 37.5626, lng: 126.9878, accuracy: 9, heading: 90, speed: 10.0 },
    { lat: 37.5625, lng: 126.9895, accuracy: 12, heading: 90, speed: 9.3 },
    { lat: 37.5624, lng: 126.9912, accuracy: 8, heading: 85, speed: 9.7 },
    { lat: 37.5623, lng: 126.993, accuracy: 10, heading: 85, speed: 10.2 },
    { lat: 37.5622, lng: 126.995, accuracy: 7, heading: 90, speed: 10.5 },
  ],
};

/** GPS 노이즈 시나리오 — 정상 좌표에 랜덤 오차 추가 */
const NOISY_ROUTE: GpsScenario = {
  name: 'GPS 노이즈 (오차 3~15m)',
  positions: NORMAL_ROUTE.positions.map((pos) => ({
    ...pos,
    lat: pos.lat + (Math.random() - 0.5) * 0.0003,
    lng: pos.lng + (Math.random() - 0.5) * 0.0003,
    accuracy: 5 + Math.random() * 25,
  })),
};

/** 경로 이탈 시나리오 — 중간에 50m 이상 벗어남 */
const DEVIATION_ROUTE: GpsScenario = {
  name: '경로 이탈 (50m+ 이탈 후 지속)',
  positions: [
    // 정상 구간
    ...NORMAL_ROUTE.positions.slice(0, 5),
    // 이탈 시작 — 경로에서 50m+ 벗어남
    { lat: 37.5648, lng: 126.9755, accuracy: 10, heading: 270, speed: 8.0 },
    { lat: 37.565, lng: 126.974, accuracy: 9, heading: 270, speed: 8.5 },
    { lat: 37.5652, lng: 126.9725, accuracy: 11, heading: 270, speed: 8.3 },
    { lat: 37.5654, lng: 126.971, accuracy: 8, heading: 270, speed: 8.7 },
    { lat: 37.5656, lng: 126.9695, accuracy: 10, heading: 270, speed: 8.9 },
    { lat: 37.5658, lng: 126.968, accuracy: 7, heading: 270, speed: 9.1 },
    // 이탈 지속 (5초 이상)
    { lat: 37.566, lng: 126.9665, accuracy: 9, heading: 270, speed: 9.0 },
    { lat: 37.5662, lng: 126.965, accuracy: 12, heading: 270, speed: 8.5 },
  ],
};

/** 사용 가능한 시나리오 목록 */
export const GPS_SCENARIOS = {
  normal: NORMAL_ROUTE,
  noisy: NOISY_ROUTE,
  deviation: DEVIATION_ROUTE,
} as const;

export type ScenarioName = keyof typeof GPS_SCENARIOS;

type GpsCallback = (position: GpsPosition) => void;

/**
 * GPS 시뮬레이터 — 미리 정의한 좌표 시퀀스를 시간 간격으로 발행한다.
 * navigator.geolocation 대신 사용하여 물리적 이동 없이 테스트.
 */
class GpsSimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentIndex = 0;
  private scenario: GpsScenario = NORMAL_ROUTE;

  /** 시나리오를 선택한다 */
  setScenario(name: ScenarioName): void {
    this.scenario = GPS_SCENARIOS[name];
    this.currentIndex = 0;
  }

  /** 시뮬레이션을 시작하고 콜백으로 좌표를 발행한다 */
  start(callback: GpsCallback): void {
    this.stop();
    this.currentIndex = 0;

    const baseTimestamp = Date.now();

    this.intervalId = setInterval(() => {
      if (this.currentIndex >= this.scenario.positions.length) {
        this.stop();
        return;
      }

      const pos = this.scenario.positions[this.currentIndex];
      callback({
        ...pos,
        timestamp: baseTimestamp + this.currentIndex * GPS_CONFIG.WATCH_INTERVAL,
      });

      this.currentIndex++;
    }, GPS_CONFIG.WATCH_INTERVAL);
  }

  /** 시뮬레이션을 중지한다 */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** 현재 시나리오 이름을 반환한다 */
  getScenarioName(): string {
    return this.scenario.name;
  }
}

export const gpsSimulator = new GpsSimulator();
