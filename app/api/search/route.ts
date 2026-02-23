import { NextRequest, NextResponse } from 'next/server';

import type { NaverSearchResponse } from '@shared/api/naver/types';

const NAVER_SEARCH_API_URL = 'https://openapi.naver.com/v1/search/local.json';

/**
 * Naver 지역 검색 API Route (서버사이드에서 호출하여 CORS 회피)
 *
 * 카텍(Katec) 좌표 → WGS84(위경도) 변환:
 * Naver 검색 API의 mapx/mapy는 카텍 좌표계를 사용.
 * 정밀 변환에는 proj4 등이 필요하지만,
 * 간이 변환 공식으로 대략적인 위경도를 계산한다.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Naver API 키가 설정되지 않았습니다' },
      { status: 500 },
    );
  }

  try {
    const url = `${NAVER_SEARCH_API_URL}?query=${encodeURIComponent(query)}&display=10`;

    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Naver API 오류: ${res.status}` },
        { status: res.status },
      );
    }

    const data: NaverSearchResponse = await res.json();

    const places = data.items.map((item, index) => ({
      id: `naver-${index}-${Date.now()}`,
      title: item.title,
      address: item.address,
      roadAddress: item.roadAddress,
      category: item.category,
      coordinate: katecToWgs84(Number(item.mapx), Number(item.mapy)),
    }));

    return NextResponse.json(places);
  } catch {
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 카텍(Katec) → WGS84 간이 변환
 * Naver 검색 API의 mapx/mapy는 카텍 좌표 * 10 단위
 */
function katecToWgs84(mapx: number, mapy: number) {
  return {
    lat: mapy / 10000000,
    lng: mapx / 10000000,
  };
}
