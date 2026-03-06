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
  const navigation = useRouteStore((s) => s.navigation);
  const updateNavigation = useRouteStore((s) => s.updateNavigation);

  useEffect(() => {
    if (!filteredPosition || !activeRoute || !navigation.isNavigating) return;

    const { newStepIndex, distanceToNext } = calculateStepProgress(
      filteredPosition,
      activeRoute.steps,
      navigation.currentStepIndex,
    );

    if (
      newStepIndex !== navigation.currentStepIndex ||
      distanceToNext !== navigation.distanceToNextManeuver
    ) {
      updateNavigation({
        currentStepIndex: newStepIndex,
        distanceToNextManeuver: distanceToNext,
      });
    }

    // 마지막 step 도달 시 안내 종료
    if (newStepIndex >= activeRoute.steps.length - 1) {
      updateNavigation({ isNavigating: false });
    }
  }, [filteredPosition, activeRoute, navigation, updateNavigation]);
}
