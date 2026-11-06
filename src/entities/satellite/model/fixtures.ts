import type { Satellite } from './types'

/** 스토리와 테스트에서 쓰는 가상 위성 데이터 */
const LINE1 = '1 25544U 98067A   26309.50000000  .00016717  00000+0  10270-3 0  9990'
const LINE2 = '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.49000000 10000'
const GEO1 = '1 36868U 10039A   26309.50000000  .00000100  00000+0  00000+0 0  9990'
const GEO2 = '2 36868   3.5000  90.0000 0002000 100.0000 200.0000  1.00270000 10000'

export const ISS_FIXTURE: Satellite = {
  noradId: 25544, name: 'ISS (ZARYA)', line1: LINE1, line2: LINE2, category: 'crewed', mission: 'crewed', orbit: 'LEO', owner: 'ISS', dualUse: false,
  objectId: '1998-067A', launchDate: '1998-11-20', launchSite: 'TYMSC', opsStatus: '+', apogeeKm: 420, perigeeKm: 412, periodMin: 92.9, inclinationDeg: 51.64, rcsM2: 399, epoch: new Date('2026-11-05T12:00:00Z'),
}

export const AEHF_FIXTURE: Satellite = {
  noradId: 36868, name: 'AEHF-1 (USA 214)', line1: GEO1, line2: GEO2, category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US', dualUse: false,
  objectId: '2010-039A', launchDate: '2010-08-14', launchSite: 'AFETR', opsStatus: '+', apogeeKm: 35800, perigeeKm: 35780, periodMin: 1436, inclinationDeg: 3.5, rcsM2: null, epoch: new Date('2026-11-05T12:00:00Z'),
}

export const FIXTURES: Satellite[] = [ISS_FIXTURE, AEHF_FIXTURE]
