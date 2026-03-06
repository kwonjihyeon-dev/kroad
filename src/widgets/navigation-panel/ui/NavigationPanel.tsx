'use client';

import { useCallback } from 'react';
import { useStepTracker } from '@features/turn-by-turn/model';
import { toInstruction } from '@features/turn-by-turn/lib';
import { useRouteStore } from '@entities/route/model';
import { formatArrivalTime, formatDistance, formatDuration } from '@shared/lib/format';
import { useUiStore } from '@shared/store/uiStore';
import { ManeuverIcon } from './ManeuverIcon';
import styles from './navigation-panel.module.scss';

/** 네비게이션 패널 — 다음 회전 안내 + 남은 거리/시간 + 안내 종료 */
export function NavigationPanel() {
  const setScreen = useUiStore((s) => s.setScreen);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const navigation = useRouteStore((s) => s.navigation);
  const updateNavigation = useRouteStore((s) => s.updateNavigation);

  useStepTracker();

  const handleStopNavigation = useCallback(() => {
    updateNavigation({ isNavigating: false });
    setScreen('home');
  }, [updateNavigation, setScreen]);

  if (!activeRoute) return null;

  const { currentStepIndex, distanceToNextManeuver } = navigation;
  const currentStep = activeRoute.steps[currentStepIndex];
  const nextStep = activeRoute.steps[currentStepIndex + 1];

  // 남은 거리/시간 계산: 현재 step 이후의 모든 step distance/duration 합산
  const remainingDistance = activeRoute.steps
    .slice(currentStepIndex)
    .reduce((sum, step) => sum + step.distance, 0);
  const remainingDuration = activeRoute.steps
    .slice(currentStepIndex)
    .reduce((sum, step) => sum + step.duration, 0);

  // 도착 예정 시각: 출발 시점 기준 + 전체 소요시간 (멱등성 보장)
  const arrivalTime = formatArrivalTime(activeRoute.departureTime, activeRoute.duration);

  // 다음 안내 정보
  const nextInstruction = nextStep
    ? toInstruction(nextStep.maneuver.type, nextStep.maneuver.modifier)
    : currentStep
      ? toInstruction(currentStep.maneuver.type, currentStep.maneuver.modifier)
      : '안내 중';
  const nextRoadName = nextStep?.name || currentStep?.name || '';
  const maneuverType = nextStep?.maneuver.type || currentStep?.maneuver.type || 'depart';
  const maneuverModifier = nextStep?.maneuver.modifier || currentStep?.maneuver.modifier;

  return (
    <div className={styles.panel}>
      <div className={styles.instruction}>
        <div className={styles.instructionIcon}>
          <ManeuverIcon type={maneuverType} modifier={maneuverModifier} />
        </div>
        <div className={styles.instructionText}>
          <span className={styles.instructionAction}>{nextInstruction}</span>
          {nextRoadName && <span className={styles.instructionRoad}>{nextRoadName}</span>}
        </div>
        <div className={styles.instructionDistance}>
          {distanceToNextManeuver > 0 ? formatDistance(distanceToNextManeuver) : ''}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>도착</span>
            <span className={styles.statValue}>{arrivalTime}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statLabel}>남은 시간</span>
            <span className={styles.statValue}>{formatDuration(remainingDuration)}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statLabel}>남은 거리</span>
            <span className={styles.statValue}>{formatDistance(remainingDistance)}</span>
          </div>
        </div>
        <button className={styles.stopButton} onClick={handleStopNavigation}>
          안내 종료
        </button>
      </div>
    </div>
  );
}
