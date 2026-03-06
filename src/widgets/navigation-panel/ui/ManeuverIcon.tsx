'use client';

interface ManeuverIconProps {
  type: string;
  modifier?: string;
}

/** 회전 방향 아이콘 — SVG 화살표로 maneuver 방향 표시 */
export function ManeuverIcon({ type, modifier }: ManeuverIconProps) {
  const rotation = getRotation(type, modifier);

  if (type === 'arrive') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
      </svg>
    );
  }

  if (type === 'roundabout' || type === 'rotary') {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 16v5" />
        <path d="M12 3v5" transform={`rotate(${rotation} 12 12)`} />
      </svg>
    );
  }

  // 기본: 방향 화살표
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotation}deg)` }}>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

function getRotation(type: string, modifier?: string): number {
  if (type === 'depart' || !modifier) return 0;

  switch (modifier) {
    case 'uturn': return 180;
    case 'sharp left': return -135;
    case 'left': return -90;
    case 'slight left': return -45;
    case 'straight': return 0;
    case 'slight right': return 45;
    case 'right': return 90;
    case 'sharp right': return 135;
    default: return 0;
  }
}
