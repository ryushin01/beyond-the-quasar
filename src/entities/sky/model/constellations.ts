/** [적경(시), 적위(도)], J2000 */
export type SkyPoint = readonly [ra: number, dec: number]

export interface Constellation {
  /** 국제천문연맹의 라틴어 이름 */
  name: string
  /** 잇는 순서대로 나열한 별자리선 */
  paths: readonly (readonly SkyPoint[])[]
}

const BETELGEUSE: SkyPoint = [5.919, 7.407]
const BELLATRIX: SkyPoint = [5.419, 6.35]
const ALNITAK: SkyPoint = [5.679, -1.943]
const MINTAKA: SkyPoint = [5.533, -0.299]
const MEGREZ: SkyPoint = [12.257, 57.033]
const VEGA: SkyPoint = [18.616, 38.784]
const LYRA_ZETA: SkyPoint = [18.746, 37.605]
const SADR: SkyPoint = [20.37, 40.257]
const ALTAIR: SkyPoint = [19.846, 8.868]
const DSCHUBBA: SkyPoint = [16.006, -22.622]
const KAUS_MEDIA: SkyPoint = [18.35, -29.828]
const KAUS_AUSTRALIS: SkyPoint = [18.403, -34.385]
const ASCELLA: SkyPoint = [19.043, -29.88]
const LEO_ALGIEBA: SkyPoint = [10.333, 19.842]
const CASTOR: SkyPoint = [7.577, 31.888]
const POLLUX: SkyPoint = [7.755, 28.026]
const TAURUS_GAMMA: SkyPoint = [4.33, 15.628]
const ELNATH: SkyPoint = [5.438, 28.608]
const CAPELLA: SkyPoint = [5.278, 45.998]
const SIRIUS: SkyPoint = [6.752, -16.716]
const WEZEN: SkyPoint = [7.14, -26.393]
const ARCTURUS: SkyPoint = [14.261, 19.182]
const VIRGO_DELTA: SkyPoint = [12.927, 3.397]
const SPICA: SkyPoint = [13.42, -11.161]
const PORRIMA: SkyPoint = [12.694, -1.449]
const MIRFAK: SkyPoint = [3.405, 49.861]
const ALPHERATZ: SkyPoint = [0.14, 29.09]
const MARKAB: SkyPoint = [23.079, 15.205]
const UMI_ZETA: SkyPoint = [15.734, 77.795]
const PHI_SGR: SkyPoint = [18.761, -26.991]

/** 밝은 별의 공개 좌표를 소수 셋째 자리로 반올림해 잇습니다. 선을 잇는 방식은 흔히 쓰는 도형을 따랐습니다. */
export const CONSTELLATIONS: readonly Constellation[] = [
  {
    name: 'Orion',
    paths: [
      [BETELGEUSE, [5.585, 9.934], BELLATRIX],
      [BETELGEUSE, ALNITAK, [5.796, -9.67], [5.242, -8.202], MINTAKA, BELLATRIX],
      [ALNITAK, [5.604, -1.202], MINTAKA],
    ],
  },
  {
    name: 'Ursa Major',
    paths: [[[13.792, 49.313], [13.399, 54.925], [12.9, 55.96], MEGREZ, [11.062, 61.751], [11.031, 56.382], [11.897, 53.695], MEGREZ]],
  },
  {
    name: 'Ursa Minor',
    paths: [[[2.53, 89.264], [17.537, 86.586], [16.766, 82.037], UMI_ZETA, [16.292, 75.755], [15.345, 71.834], [14.845, 74.156], UMI_ZETA]],
  },
  { name: 'Cassiopeia', paths: [[[0.153, 59.15], [0.675, 56.537], [0.945, 60.717], [1.43, 60.235], [1.907, 63.67]]] },
  {
    name: 'Cygnus',
    paths: [
      [[20.69, 45.28], SADR, [19.938, 35.083], [19.512, 27.96]],
      [[20.77, 33.97], SADR, [19.75, 45.131], [19.495, 51.73]],
    ],
  },
  {
    name: 'Lyra',
    paths: [
      [VEGA, [18.739, 39.67], LYRA_ZETA, VEGA],
      [LYRA_ZETA, [18.835, 33.363], [18.982, 32.69], [18.908, 36.899], LYRA_ZETA],
    ],
  },
  {
    name: 'Aquila',
    paths: [
      [[19.771, 10.613], ALTAIR, [19.922, 6.407], [20.188, -0.821]],
      [ALTAIR, [19.425, 3.115], [19.104, -4.882]],
      [[19.425, 3.115], [19.09, 13.863]],
    ],
  },
  {
    name: 'Scorpius',
    paths: [
      [[16.091, -19.805], DSCHUBBA, [15.981, -26.114]],
      [
        DSCHUBBA,
        [16.353, -25.593],
        [16.49, -26.432],
        [16.598, -28.216],
        [16.836, -34.293],
        [16.864, -38.048],
        [16.91, -42.362],
        [17.203, -43.239],
        [17.622, -42.998],
        [17.793, -40.127],
        [17.708, -39.03],
        [17.56, -37.104],
        [17.512, -37.296],
      ],
    ],
  },
  {
    name: 'Sagittarius',
    paths: [
      [[18.097, -30.424], KAUS_MEDIA, [18.466, -25.421], PHI_SGR, [18.921, -26.297], [19.116, -27.671], ASCELLA, PHI_SGR, KAUS_MEDIA, KAUS_AUSTRALIS, ASCELLA],
      [[18.097, -30.424], KAUS_AUSTRALIS],
    ],
  },
  {
    name: 'Leo',
    paths: [[[9.764, 23.774], [9.879, 26.007], [10.278, 23.417], LEO_ALGIEBA, [10.122, 16.763], [10.139, 11.967], [11.237, 15.43], [11.818, 14.572], [11.235, 20.524], LEO_ALGIEBA]],
  },
  {
    name: 'Gemini',
    paths: [
      [CASTOR, [6.732, 25.131], [6.383, 22.514], [6.248, 22.507]],
      [POLLUX, [7.335, 21.982], [7.068, 20.57], [6.629, 16.399]],
      [CASTOR, POLLUX],
    ],
  },
  {
    name: 'Taurus',
    paths: [
      [[5.627, 21.143], [4.599, 16.509], TAURUS_GAMMA, [4.011, 12.49], [3.413, 9.029]],
      [ELNATH, [4.477, 19.18], [4.382, 17.543], TAURUS_GAMMA],
    ],
  },
  { name: 'Auriga', paths: [[CAPELLA, [5.992, 44.947], [5.995, 37.212], ELNATH, [4.95, 33.166], [5.033, 43.823], CAPELLA]] },
  {
    name: 'Canis Major',
    paths: [
      [[6.378, -17.956], SIRIUS, [7.063, -15.633]],
      [SIRIUS, WEZEN, [7.402, -29.303]],
      [WEZEN, [6.977, -28.972], [6.338, -30.063]],
    ],
  },
  { name: 'Canis Minor', paths: [[[7.655, 5.225], [7.453, 8.289]]] },
  { name: 'Bootes', paths: [[[13.911, 18.398], ARCTURUS, [14.75, 27.074], [15.258, 33.315], [15.032, 40.391], [14.535, 38.308], [14.531, 30.371], ARCTURUS]] },
  {
    name: 'Virgo',
    paths: [
      [SPICA, [13.578, -0.596], VIRGO_DELTA, [13.036, 10.959]],
      [VIRGO_DELTA, PORRIMA, [12.332, -0.667], [11.845, 1.765]],
      [SPICA, PORRIMA],
    ],
  },
  {
    name: 'Perseus',
    paths: [
      [[3.08, 53.506], MIRFAK, [3.715, 47.788], [3.964, 40.01], [3.902, 31.884]],
      [MIRFAK, [3.136, 40.956]],
    ],
  },
  { name: 'Andromeda', paths: [[ALPHERATZ, [0.655, 30.861], [1.162, 35.621], [2.065, 42.33]]] },
  {
    name: 'Pegasus',
    paths: [
      [ALPHERATZ, [23.063, 28.083], MARKAB, [0.221, 15.184], ALPHERATZ],
      [MARKAB, [22.691, 10.831], [22.17, 6.198], [21.736, 9.875]],
    ],
  },
  {
    name: 'Crux',
    paths: [
      [[12.443, -63.099], [12.519, -57.113]],
      [[12.795, -59.689], [12.252, -58.749]],
    ],
  },
  { name: 'Corona Borealis', paths: [[[15.464, 29.106], [15.549, 31.359], [15.578, 26.715], [15.712, 26.296], [15.826, 26.068], [15.96, 26.878]]] },
  { name: 'Hercules', paths: [[[16.504, 21.49], [16.688, 31.603], [16.714, 38.922], [17.251, 36.809], [17.005, 30.926], [16.688, 31.603]]] },
  { name: 'Aries', paths: [[[2.12, 23.462], [1.911, 20.808], [1.892, 19.294]]] },
  { name: 'Corvus', paths: [[[12.263, -17.542], [12.498, -16.515], [12.573, -23.397], [12.169, -22.62], [12.263, -17.542]]] },
]
