const DEG = Math.PI / 180

export interface ViewCenter {
  longitude: number
  latitude: number
}

export interface GlobePoint {
  /** 지구 반지름을 1로 둔 화면 좌표. y는 위쪽이 양수입니다. */
  x: number
  y: number
  /** 양수면 보이는 반구입니다. 1에 가까울수록 화면 중심입니다. */
  z: number
}

/** 경위도를 정사영 지구본의 좌표로 바꿉니다. */
export function projectToView(longitude: number, latitude: number, view: ViewCenter): GlobePoint {
  const lat = latitude * DEG
  const lat0 = view.latitude * DEG
  const dLon = (longitude - view.longitude) * DEG
  return {
    x: Math.cos(lat) * Math.sin(dLon),
    y: Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(dLon),
    z: Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(dLon),
  }
}

/** 면적이 고르게 보이도록 고위도일수록 경도 간격을 넓혀 육지 위의 점을 고릅니다. */
export function landDots(isLand: (longitude: number, latitude: number) => boolean, stepDeg = 2): [number, number][] {
  const dots: [number, number][] = []
  for (let latitude = -88; latitude <= 88; latitude += stepDeg) {
    const lonStep = stepDeg / Math.max(0.1, Math.cos(latitude * DEG))
    for (let longitude = -180; longitude < 180; longitude += lonStep) {
      if (isLand(longitude, latitude)) dots.push([longitude, latitude])
    }
  }
  return dots
}
