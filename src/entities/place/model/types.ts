import type { Coordinate } from '@shared/lib/types';

/** 장소 정보 */
export interface Place {
  /** 장소 고유 ID */
  id: string;
  /** 장소명 */
  title: string;
  /** 주소 */
  address: string;
  /** 도로명 주소 */
  roadAddress: string;
  /** 카테고리 */
  category: string;
  /** 좌표 */
  coordinate: Coordinate;
}
