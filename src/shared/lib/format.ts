/**
 * 미터 → 사람이 읽기 쉬운 거리 문자열
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 초 → 사람이 읽기 쉬운 시간 문자열
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `${hours}시간 ${remainMinutes}분` : `${hours}시간`;
}

/**
 * 소요시간(초)을 기반으로 도착 예정 시각 문자열을 반환한다.
 * @example formatArrivalTime(3600) → "오후 3:05"
 */
export function formatArrivalTime(durationSeconds: number): string {
  const arrival = new Date(Date.now() + durationSeconds * 1000);
  return arrival.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface BoldSegment {
  text: string;
  bold: boolean;
}

/**
 * HTML 문자열에서 <b> 태그를 파싱하여 세그먼트 배열로 반환한다.
 * 그 외 HTML 태그는 모두 제거된다.
 */
export function parseBoldHtml(html: string): BoldSegment[] {
  const segments: BoldSegment[] = [];
  const regex = /<b>(.*?)<\/b>/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: stripTags(html.slice(lastIndex, match.index)), bold: false });
    }
    segments.push({ text: stripTags(match[1]), bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    segments.push({ text: stripTags(html.slice(lastIndex)), bold: false });
  }

  return segments.filter((s) => s.text.length > 0);
}

/** 모든 HTML 태그를 제거한다 */
function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}
