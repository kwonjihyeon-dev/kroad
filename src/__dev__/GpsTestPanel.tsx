'use client';

import { useCallback, useState } from 'react';

import { useGpsTracking } from '@features/gps-tracking';
import { useMapMatching } from '@features/map-matching';

import { useGpsStore } from '@entities/position';
import type { GpsPosition } from '@entities/position';

import { useMapStore } from '@shared/store/mapStore';

import { gpsSimulator, type ScenarioName } from '@dev/gpsSimulator';

/**
 * GPS 시뮬레이션 테스트 패널 (개발 전용)
 * 시나리오 선택 → 시뮬레이터 시작 → 칼만 필터 + 마커 이동 확인
 */
export function GpsTestPanel() {
  const [scenario, setScenario] = useState<ScenarioName>('normal');
  const [isSimulating, setIsSimulating] = useState(false);

  const map = useMapStore((s) => s.mapInstance);
  const rawPosition = useGpsStore((s) => s.rawPosition);
  const filteredPosition = useGpsStore((s) => s.filteredPosition);

  const { addPosition, start: startMatching, stop: stopMatching } = useMapMatching();
  const { start, stop } = useGpsTracking({ onPosition: addPosition });

  const handleStart = useCallback(() => {
    gpsSimulator.setScenario(scenario);

    start();
    startMatching();

    // 시뮬레이터로 watchPosition 대체
    gpsSimulator.start((position: GpsPosition) => {
      useGpsStore.getState().updateRawPosition(position);

      // 지도 카메라를 현재 위치로 이동
      if (map) {
        map.panTo(new naver.maps.LatLng(position.lat, position.lng));
      }
    });

    setIsSimulating(true);
  }, [scenario, map, start, startMatching]);

  const handleStop = useCallback(() => {
    gpsSimulator.stop();
    stop();
    stopMatching();
    setIsSimulating(false);
  }, [stop, stopMatching]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: 16,
        borderRadius: 12,
        fontSize: 13,
        zIndex: 9999,
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>GPS Test Panel</div>

      <div style={{ marginBottom: 8 }}>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as ScenarioName)}
          disabled={isSimulating}
          style={{
            width: '100%',
            padding: '4px 8px',
            borderRadius: 6,
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
          }}
        >
          <option value="normal">정상 주행</option>
          <option value="noisy">GPS 노이즈</option>
          <option value="deviation">경로 이탈</option>
        </select>
      </div>

      <button
        onClick={isSimulating ? handleStop : handleStart}
        style={{
          width: '100%',
          padding: '6px 12px',
          borderRadius: 6,
          background: isSimulating ? '#e74c3c' : '#4A90D9',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {isSimulating ? '중지' : '시뮬레이션 시작'}
      </button>

      {rawPosition && (
        <div style={{ marginTop: 10, lineHeight: 1.6 }}>
          <div style={{ color: '#aaa' }}>Raw GPS</div>
          <div>
            {rawPosition.lat.toFixed(6)}, {rawPosition.lng.toFixed(6)}
          </div>
          {filteredPosition && (
            <>
              <div style={{ color: '#aaa', marginTop: 4 }}>Filtered</div>
              <div>
                {filteredPosition.lat.toFixed(6)}, {filteredPosition.lng.toFixed(6)}
              </div>
              <div style={{ color: '#aaa', marginTop: 4 }}>Snapped: {String(filteredPosition.isSnapped)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
