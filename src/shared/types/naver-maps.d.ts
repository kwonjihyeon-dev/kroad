/** Naver Maps JavaScript API v3 최소 타입 선언 */
declare namespace naver.maps {
  class Map {
    constructor(el: HTMLElement, options?: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(zoom: number): void;
    getCenter(): LatLng;
    getZoom(): number;
    panTo(latlng: LatLng, transitionOptions?: object): void;
    destroy(): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setPosition(latlng: LatLng): void;
    setMap(map: Map | null): void;
  }

  class Polyline {
    constructor(options?: PolylineOptions);
    setMap(map: Map | null): void;
    setPath(path: LatLng[]): void;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    zoomControl?: boolean;
    mapDataControl?: boolean;
    scaleControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLng;
    map?: Map;
    icon?: MarkerIcon;
  }

  interface MarkerIcon {
    content?: string;
    size?: Size;
    anchor?: Point;
  }

  interface PolylineOptions {
    path?: LatLng[];
    map?: Map;
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }
}

interface Window {
  naver: typeof naver;
}
