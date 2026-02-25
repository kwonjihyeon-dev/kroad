/** Naver 지역 검색 API 응답 */
export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchItem[];
}

/** Naver 지역 검색 결과 아이템 */
export interface NaverSearchItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  /** 카텍 X좌표 (경도 변환 필요) */
  mapx: string;
  /** 카텍 Y좌표 (위도 변환 필요) */
  mapy: string;
}
