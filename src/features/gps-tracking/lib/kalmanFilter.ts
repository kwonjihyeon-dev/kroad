/**
 * 1D 칼만 필터 — GPS 좌표 노이즈 제거용
 *
 * [예측] 이전 위치 + 속도 → "지금쯤 여기 있겠지"
 * [실제] GPS가 알려준 좌표 (노이즈 포함)
 * [보정] 예측값과 GPS값의 가중평균 → 부드러운 최종 좌표
 */
export class KalmanFilter {
  /** 현재 추정값 */
  private estimate: number;
  /** 추정 오차 공분산 */
  private errorCovariance: number;
  /** 프로세스 노이즈 (값이 클수록 측정값에 민감) */
  private processNoise: number;
  /** 측정 노이즈 (값이 클수록 측정값을 덜 신뢰) */
  private measurementNoise: number;
  /** 초기화 여부 */
  private initialized: boolean;

  constructor(processNoise = 0.01, measurementNoise = 3) {
    this.estimate = 0;
    this.errorCovariance = 1;
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.initialized = false;
  }

  /** 새 측정값으로 필터를 업데이트하고 보정된 추정값을 반환한다 */
  filter(measurement: number): number {
    if (!this.initialized) {
      this.estimate = measurement;
      this.initialized = true;
      return this.estimate;
    }

    // 예측 단계: 오차 공분산 증가
    const predictedCovariance = this.errorCovariance + this.processNoise;

    // 업데이트 단계: 칼만 이득 계산
    const kalmanGain = predictedCovariance / (predictedCovariance + this.measurementNoise);

    // 보정: 예측값과 측정값의 가중평균
    this.estimate = this.estimate + kalmanGain * (measurement - this.estimate);
    this.errorCovariance = (1 - kalmanGain) * predictedCovariance;

    return this.estimate;
  }

  /** 필터 상태를 초기화한다 */
  reset(): void {
    this.estimate = 0;
    this.errorCovariance = 1;
    this.initialized = false;
  }
}
