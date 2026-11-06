export const VERTEX_SHADER = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

/**
 * 퀘이사: 기울어진 강착원반 + 상대론적 제트 + 중심핵.
 * 포인터 주변은 격자 칸 단위로 끊겨(모자이크) 보이고, 포인터가 빠르게 지날수록 넓어집니다.
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerPower;
uniform float uTime;
uniform float uProgress;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) { value += amp * noise(p); p *= 2.05; amp *= 0.5; }
  return value;
}

vec2 rotate(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float quasar(vec2 p, float time) {
  p = rotate(p, -0.42);
  // 원반을 납작하게 보이도록 y를 늘립니다.
  vec2 d = vec2(p.x, p.y * 3.4);
  float r = length(d);
  // 각도를 직접 쓰면 경계에 이음매가 생기므로 좌표를 돌려서 소용돌이를 만듭니다.
  vec2 q = rotate(d, time * 0.35 + 1.9 / (r + 0.22));
  float swirl = fbm(q * vec2(3.2, 9.0) + vec2(0.0, r * 6.0 - time * 0.4));
  float disc = smoothstep(0.95, 0.12, r) * smoothstep(0.06, 0.2, r) * (0.28 + swirl * 1.05);
  // 위아래로 뻗는 제트
  float jetWidth = 0.012 + abs(p.y) * 0.05;
  float jet = exp(-pow(p.x / jetWidth, 2.0)) * smoothstep(1.5, 0.03, abs(p.y));
  jet *= 0.5 + 0.7 * fbm(vec2(p.y * 7.0 - sign(p.y) * time * 1.6, p.x * 22.0));
  float core = 0.018 / (length(p) + 0.018);
  return disc + jet * 0.95 + core * 0.9;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 pointer = uPointer;

  // 포인터 주변을 격자 칸으로 끊습니다.
  float cells = 22.0;
  vec2 grid = vec2(cells * aspect.x, cells);
  vec2 cell = (floor(uv * grid) + 0.5) / grid;
  float dist = length((cell - pointer) * aspect);
  float radius = 0.05 + 0.26 * uPointerPower;
  float mosaic = smoothstep(radius, radius * 0.55, dist) * smoothstep(0.01, 0.08, uPointerPower);
  vec2 sampleUv = mix(uv, cell, mosaic);

  vec2 p = (sampleUv - 0.5) * aspect * 2.0;
  p.x -= aspect.x * 0.34 * (1.0 - uProgress);
  p /= 1.0 + uProgress * 2.6;
  // 포인터 쪽으로 공간이 살짝 휩니다.
  vec2 toPointer = (pointer - 0.5) * aspect * 2.0 - p;
  p += toPointer * 0.05 * exp(-dot(toPointer, toPointer) * 2.5);

  float value = quasar(p, uTime);

  // 배경 격자선과 칸 강조
  vec2 lines = abs(fract(uv * grid) - 0.5);
  float gridLine = smoothstep(0.485, 0.5, max(lines.x, lines.y));

  vec3 blue = vec3(0.24, 0.42, 1.0);
  vec3 color = vec3(0.0);
  color += blue * smoothstep(0.0, 0.9, value) * 0.95;
  color += vec3(1.0) * pow(max(value - 0.35, 0.0), 1.6);
  color += vec3(1.0) * gridLine * 0.055;
  color += blue * gridLine * mosaic * 0.5;
  color += vec3(0.8) * mosaic * hash(cell + floor(uTime * 6.0)) * 0.05 * uPointerPower;


  gl_FragColor = vec4(color, 1.0);
}
`
