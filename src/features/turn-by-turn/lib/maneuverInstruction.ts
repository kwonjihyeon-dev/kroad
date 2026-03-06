const TYPE_MAP: Record<string, string> = {
  depart: '출발',
  arrive: '도착',
  turn: '회전',
  continue: '직진',
  'new name': '직진',
  merge: '합류',
  'on ramp': '진입',
  'off ramp': '진출',
  fork: '분기',
  'end of road': '도로 끝',
  roundabout: '회전교차로',
  'roundabout turn': '회전교차로',
  rotary: '로터리',
  notification: '',
};

const MODIFIER_MAP: Record<string, string> = {
  uturn: 'U턴',
  'sharp right': '크게 우회전',
  right: '우회전',
  'slight right': '살짝 우회전',
  straight: '직진',
  'slight left': '살짝 좌회전',
  left: '좌회전',
  'sharp left': '크게 좌회전',
};

/**
 * OSRM maneuver를 한글 안내 문자열로 변환한다.
 *
 * @example
 * toInstruction("turn", "left")       → "좌회전"
 * toInstruction("depart")             → "출발"
 * toInstruction("arrive")             → "도착"
 * toInstruction("roundabout", "right") → "회전교차로 우회전"
 */
export function toInstruction(type: string, modifier?: string): string {
  if (type === 'arrive') return '도착';
  if (type === 'depart') return '출발';

  const modifierText = modifier ? MODIFIER_MAP[modifier] ?? modifier : null;
  const typeText = TYPE_MAP[type] ?? type;

  if (type === 'roundabout' || type === 'rotary') {
    return modifierText ? `${typeText} ${modifierText}` : typeText;
  }

  return modifierText ?? typeText;
}
