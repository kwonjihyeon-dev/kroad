import type { RouteStep } from '@entities/route/model';
import { NAVIGATION_CONFIG } from '@shared/config/navigation';
import { distanceBetween } from '@shared/lib/coordinateUtils';
import type { Coordinate } from '@shared/lib/types';

interface StepProgressResult {
  newStepIndex: number;
  distanceToNext: number;
}

/**
 * 현재 위치 기반으로 step 진행 상태를 계산한다.
 * - 다음 maneuver 지점까지 거리가 임계값 이내이면 step을 넘긴다.
 * - 연속으로 여러 step을 통과할 수 있다 (짧은 step이 연속될 때).
 */
export function calculateStepProgress(
  position: Coordinate,
  steps: RouteStep[],
  currentStepIndex: number,
): StepProgressResult {
  let index = currentStepIndex;

  while (index + 1 < steps.length) {
    const nextManeuver = steps[index + 1].maneuver.location;
    const distance = distanceBetween(position, nextManeuver);

    if (distance <= NAVIGATION_CONFIG.STEP_ARRIVAL_THRESHOLD) {
      index++;
    } else {
      return { newStepIndex: index, distanceToNext: distance };
    }
  }

  // 마지막 step(arrive)에 도달
  return { newStepIndex: index, distanceToNext: 0 };
}
