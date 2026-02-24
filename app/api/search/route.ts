import { NextRequest, NextResponse } from 'next/server';

import type { NaverSearchResponse } from '@shared/api/naver/types';

const NAVER_SEARCH_API_URL = 'https://openapi.naver.com/v1/search/local.json';

/**
 * Naver 지역 검색 API Route (서버사이드에서 호출하여 CORS 회피)
 *
 * mapx/mapy는 WGS84 좌표에 10,000,000을 곱한 정수 형태로 반환됨.
 * 예: mapx=1269770162 → lng=126.9770162
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Naver API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    const url = `${NAVER_SEARCH_API_URL}?query=${encodeURIComponent(query)}&display=5`;

    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Naver API 오류: ${res.status}` }, { status: res.status });
    }

    const data: NaverSearchResponse = await res.json();

    const places = data.items.map((item, index) => ({
      id: `naver-${index}-${Date.now()}`,
      title: item.title,
      address: item.address,
      roadAddress: item.roadAddress,
      category: item.category,
      coordinate: parseNaverCoord(Number(item.mapx), Number(item.mapy)),
    }));

    console.log(places, data);

    return NextResponse.json(places);
  } catch {
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}

/** Naver 검색 API의 mapx/mapy(WGS84 × 10,000,000) → 위경도 변환 */
function parseNaverCoord(mapx: number, mapy: number) {
  return {
    lat: mapy / 10000000,
    lng: mapx / 10000000,
  };
}
