'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGpsTracking } from '@features/gps-tracking/model';
import { useStepTracker } from '@features/turn-by-turn/model';
import { toInstruction } from '@features/turn-by-turn/lib';
import { useGpsStore } from '@entities/position/model';
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
  const clearRoute = useRouteStore((s) => s.clearRoute);
  const gpsTimestamp = useGpsStore((s) => s.rawPosition?.timestamp ?? 0);
  const { start: startGps, stop: stopGps } = useGpsTracking();

  useStepTracker();

  // NavigationPanel 마운트 시 GPS 추적 시작, 언마운트 시 중지
  useEffect(() => {
    startGps();
    return () => stopGps();
  }, [startGps, stopGps]);

  const [showArrivalTime, setShowArrivalTime] = useState(true);

  const handleStopNavigation = useCallback(() => {
    clearRoute();
    setScreen('home');
  }, [clearRoute, setScreen]);

  const { remainingDistance, remainingDuration } = useMemo(() => {
    if (!activeRoute) return { remainingDistance: 0, remainingDuration: 0 };

    const { currentStepIndex, distanceToNextManeuver } = navigation;
    const currentStep = activeRoute.steps[currentStepIndex];
    const futureSteps = activeRoute.steps.slice(currentStepIndex + 1);
    const futureDistance = futureSteps.reduce((sum, step) => sum + step.distance, 0);
    const futureDuration = futureSteps.reduce((sum, step) => sum + step.duration, 0);
    const currentStepDistance = currentStep?.distance || 0;
    const currentStepDuration = currentStep?.duration || 0;
    const progressRatio =
      currentStepDistance > 0 ? distanceToNextManeuver / currentStepDistance : 0;

    return {
      remainingDistance: distanceToNextManeuver + futureDistance,
      remainingDuration: currentStepDuration * progressRatio + futureDuration,
    };
  }, [activeRoute, navigation]);

  if (!activeRoute) return null;

  const { currentStepIndex, distanceToNextManeuver } = navigation;
  const currentStep = activeRoute.steps[currentStepIndex];
  const nextStep = activeRoute.steps[currentStepIndex + 1];

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
          {formatDistance(distanceToNextManeuver)}
        </div>
      </div>

      <div className={styles.footer}>
        <div
          className={styles.stats}
          onClick={() => setShowArrivalTime((prev) => !prev)}
        >
          <div className={styles.stat}>
            <span className={styles.statValueLarge}>
              {showArrivalTime
                ? gpsTimestamp ? formatArrivalTime(gpsTimestamp, remainingDuration) : ''
                : formatDuration(remainingDuration)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValueLarge}>{formatDistance(remainingDistance)}</span>
          </div>
        </div>
        <button className={styles.stopButton} onClick={handleStopNavigation}>
          안내 종료
        </button>
      </div>
    </div>
  );
}
