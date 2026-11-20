import { select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent, type ZoomTransform } from 'd3-zoom'

/** 휠은 넓은 화면에서만 확대하고, 터치는 두 손가락만 지도를 움직입니다(한 손가락은 페이지 스크롤). 마우스는 왼쪽 버튼만 씁니다. */
export function acceptsMapGesture(event: Event, isWide: () => boolean): boolean {
  if (event.type === 'wheel') return isWide()
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) return event.touches.length >= 2
  return !(event as MouseEvent).button
}

export interface MapZoom {
  zoomBy(factor: number): void
  reset(): void
}

/** 캔버스에 확대·끌기를 붙입니다. 사용자가 직접 움직였는지(fromUser)도 함께 알립니다. */
export function attachMapZoom(canvas: HTMLCanvasElement, onZoom: (transform: ZoomTransform, fromUser: boolean) => void): MapZoom {
  const behavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([1, 8])
    .filter((event: Event) => acceptsMapGesture(event, () => window.matchMedia('(min-width: 1100px)').matches))
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => onZoom(event.transform, Boolean(event.sourceEvent)))
  select(canvas).call(behavior).style('touch-action', 'pan-y').on('dblclick.zoom', null)
  return {
    zoomBy: (factor) => select(canvas).call(behavior.scaleBy, factor),
    reset: () => select(canvas).call(behavior.transform, zoomIdentity),
  }
}
