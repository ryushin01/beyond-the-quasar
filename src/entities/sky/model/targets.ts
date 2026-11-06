export type TargetKind = 'quasar' | 'galaxy' | 'nebula' | 'cluster'

export interface DeepSkyTarget {
  id: string
  name: string
  kind: TargetKind
  /** 적경(시), J2000 */
  ra: number
  /** 적위(도), J2000 */
  dec: number
  magnitude: number
}

/** 관측 대상. 좌표와 등급은 SIMBAD·Messier 목록의 공개 값을 반올림한 것입니다. */
export const TARGETS: DeepSkyTarget[] = [
  { id: '3c273', name: '3C 273', kind: 'quasar', ra: 12.4853, dec: 2.052, magnitude: 12.9 },
  { id: '3c48', name: '3C 48', kind: 'quasar', ra: 1.6281, dec: 33.16, magnitude: 16.2 },
  { id: 'mkn421', name: 'Markarian 421', kind: 'quasar', ra: 11.0743, dec: 38.209, magnitude: 12.9 },
  { id: 'm31', name: 'M31 Andromeda', kind: 'galaxy', ra: 0.7123, dec: 41.269, magnitude: 3.4 },
  { id: 'm33', name: 'M33 Triangulum', kind: 'galaxy', ra: 1.5641, dec: 30.66, magnitude: 5.7 },
  { id: 'm51', name: 'M51 Whirlpool', kind: 'galaxy', ra: 13.498, dec: 47.195, magnitude: 8.4 },
  { id: 'm81', name: 'M81 Bode', kind: 'galaxy', ra: 9.9256, dec: 69.065, magnitude: 6.9 },
  { id: 'm42', name: 'M42 Orion', kind: 'nebula', ra: 5.5881, dec: -5.391, magnitude: 4.0 },
  { id: 'm57', name: 'M57 Ring', kind: 'nebula', ra: 18.8931, dec: 33.029, magnitude: 8.8 },
  { id: 'm8', name: 'M8 Lagoon', kind: 'nebula', ra: 18.0603, dec: -24.387, magnitude: 6.0 },
  { id: 'm45', name: 'M45 Pleiades', kind: 'cluster', ra: 3.7904, dec: 24.117, magnitude: 1.6 },
  { id: 'm13', name: 'M13 Hercules', kind: 'cluster', ra: 16.6948, dec: 36.46, magnitude: 5.8 },
]

export interface Star {
  name: string
  ra: number
  dec: number
  magnitude: number
}

/** 밝은 별 (J2000). 하늘 지도의 배경으로 씁니다. */
export const BRIGHT_STARS: Star[] = [
  { name: 'Sirius', ra: 6.7525, dec: -16.716, magnitude: -1.46 },
  { name: 'Canopus', ra: 6.3992, dec: -52.696, magnitude: -0.74 },
  { name: 'Arcturus', ra: 14.261, dec: 19.182, magnitude: -0.05 },
  { name: 'Rigil Kentaurus', ra: 14.6601, dec: -60.835, magnitude: -0.01 },
  { name: 'Vega', ra: 18.6156, dec: 38.784, magnitude: 0.03 },
  { name: 'Capella', ra: 5.2782, dec: 45.998, magnitude: 0.08 },
  { name: 'Rigel', ra: 5.2423, dec: -8.202, magnitude: 0.13 },
  { name: 'Procyon', ra: 7.655, dec: 5.225, magnitude: 0.34 },
  { name: 'Betelgeuse', ra: 5.9195, dec: 7.407, magnitude: 0.42 },
  { name: 'Achernar', ra: 1.6286, dec: -57.237, magnitude: 0.46 },
  { name: 'Hadar', ra: 14.0637, dec: -60.373, magnitude: 0.61 },
  { name: 'Altair', ra: 19.8464, dec: 8.868, magnitude: 0.76 },
  { name: 'Acrux', ra: 12.4433, dec: -63.099, magnitude: 0.76 },
  { name: 'Aldebaran', ra: 4.5987, dec: 16.509, magnitude: 0.86 },
  { name: 'Antares', ra: 16.4901, dec: -26.432, magnitude: 0.96 },
  { name: 'Spica', ra: 13.4199, dec: -11.161, magnitude: 0.97 },
  { name: 'Pollux', ra: 7.7553, dec: 28.026, magnitude: 1.14 },
  { name: 'Fomalhaut', ra: 22.9608, dec: -29.622, magnitude: 1.16 },
  { name: 'Deneb', ra: 20.6905, dec: 45.28, magnitude: 1.25 },
  { name: 'Mimosa', ra: 12.7953, dec: -59.689, magnitude: 1.25 },
  { name: 'Regulus', ra: 10.1395, dec: 11.967, magnitude: 1.35 },
  { name: 'Adhara', ra: 6.9771, dec: -28.972, magnitude: 1.5 },
  { name: 'Castor', ra: 7.5767, dec: 31.888, magnitude: 1.58 },
  { name: 'Shaula', ra: 17.5601, dec: -37.104, magnitude: 1.62 },
  { name: 'Bellatrix', ra: 5.4189, dec: 6.35, magnitude: 1.64 },
  { name: 'Elnath', ra: 5.4382, dec: 28.608, magnitude: 1.65 },
  { name: 'Alnilam', ra: 5.6036, dec: -1.202, magnitude: 1.69 },
  { name: 'Alnitak', ra: 5.6793, dec: -1.943, magnitude: 1.74 },
  { name: 'Mintaka', ra: 5.5334, dec: -0.299, magnitude: 2.25 },
  { name: 'Alioth', ra: 12.9005, dec: 55.96, magnitude: 1.76 },
  { name: 'Dubhe', ra: 11.0621, dec: 61.751, magnitude: 1.79 },
  { name: 'Merak', ra: 11.0307, dec: 56.382, magnitude: 2.37 },
  { name: 'Mizar', ra: 13.3987, dec: 54.925, magnitude: 2.23 },
  { name: 'Alkaid', ra: 13.7923, dec: 49.313, magnitude: 1.85 },
  { name: 'Polaris', ra: 2.5302, dec: 89.264, magnitude: 1.98 },
  { name: 'Mirfak', ra: 3.4054, dec: 49.861, magnitude: 1.79 },
  { name: 'Alpheratz', ra: 0.1398, dec: 29.09, magnitude: 2.06 },
  { name: 'Schedar', ra: 0.6751, dec: 56.537, magnitude: 2.24 },
  { name: 'Caph', ra: 0.1529, dec: 59.15, magnitude: 2.28 },
  { name: 'Hamal', ra: 2.1196, dec: 23.462, magnitude: 2.0 },
  { name: 'Denebola', ra: 11.8177, dec: 14.572, magnitude: 2.13 },
  { name: 'Rasalhague', ra: 17.5822, dec: 12.56, magnitude: 2.07 },
  { name: 'Kochab', ra: 14.8451, dec: 74.156, magnitude: 2.08 },
  { name: 'Sadr', ra: 20.3705, dec: 40.257, magnitude: 2.23 },
  { name: 'Enif', ra: 21.7364, dec: 9.875, magnitude: 2.39 },
  { name: 'Markab', ra: 23.0794, dec: 15.205, magnitude: 2.48 },
]
