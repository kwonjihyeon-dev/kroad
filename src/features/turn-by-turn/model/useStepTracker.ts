import { useEffect } from 'react';
import { useGpsStore } from '@entities/position/model';
import { useRouteStore } from '@entities/route/model';
import { calculateStepProgress } from '../lib';

/**
 * filteredPosition이 변경될 때마다 step 진행 상태를 갱신한다.
 * 마지막 step(arrive)에 도달하면 안내를 종료한다.
 */
export function useStepTracker() {
  const filteredPosition = useGpsStore((s) => s.filteredPosition);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const isNavigating = useRouteStore((s) => s.navigation.isNavigating);
  const currentStepIndex = useRouteStore((s) => s.navigation.currentStepIndex);
  const distanceToNextManeuver = useRouteStore((s) => s.navigation.distanceToNextManeuver);
  const updateNavigation = useRouteStore((s) => s.updateNavigation);

  useEffect(() => {
    if (!filteredPosition || !activeRoute || !isNavigating) return;

    const { newStepIndex, distanceToNext } = calculateStepProgress(
      filteredPosition,
      activeRoute.steps,
      currentStepIndex,
    );

    if (
      newStepIndex !== currentStepIndex ||
      distanceToNext !== distanceToNextManeuver
    ) {
      updateNavigation({
        currentStepIndex: newStepIndex,
        distanceToNextManeuver: distanceToNext,
      });
    }

  }, [filteredPosition, activeRoute, isNavigating, currentStepIndex, distanceToNextManeuver, updateNavigation]);
}
