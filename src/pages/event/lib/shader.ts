export const VERTEX_SHADER = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

/**
 * 장면 두 개를 한 프로그램에 담습니다.
 * - 입구: 어두운 산 사이 수면 위에 뜬 빛의 고리와 물에 비친 잔물결
 * - 지평선: 슈바르츠실트 반지름을 1로 둔 광선 적분. 빛이 휘면서 원반 뒤쪽이 그림자 위로 솟아 보입니다.
 * uMix는 두 장면의 비율, uFall은 블랙홀 안으로 떨어지는 정도, uDim은 글을 읽는 구역의 어둡기입니다.
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMix;
uniform float uFall;
uniform float uDim;

const float HORIZON = -0.14;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y);
  float b = mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y);
  return mix(a, b, f.z);
}

float fbm(vec2 p) {
  float value = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) { value += amp * noise(p); p *= 2.1; amp *= 0.5; }
  return value;
}

float stars(vec2 p, float density) {
  vec2 cell = floor(p * density);
  vec2 local = fract(p * density) - 0.5;
  float seed = hash(cell);
  if (seed < 0.93) return 0.0;
  vec2 offset = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
  return smoothstep(0.16, 0.0, length(local - offset * 0.6)) * (seed - 0.93) * 14.0;
}

/* ---------- 입구: 수면 위의 빛 고리 ---------- */

float ridgeHeight(float x) {
  float side = abs(x);
  float slope = smoothstep(0.34, 1.7, side) * 0.82;
  return HORIZON + slope * (0.55 + fbm(vec2(x * 2.4, 3.0)) * 0.7) - 0.02;
}

vec3 aboveWater(vec2 p, float t, float reflected) {
  float lift = max(p.y - HORIZON, 0.0);
  vec3 color = mix(vec3(0.012, 0.075, 0.24), vec3(0.0, 0.008, 0.04), smoothstep(0.0, 1.1, lift));
  color += stars(p + 8.0, 34.0) * vec3(0.7, 0.8, 1.0);

  vec2 c = p - vec2(0.0, 0.24);
  float sway = 0.86 + 0.14 * sin(t * 0.32);
  c.x /= sway;
  float r = length(c);
  float d = abs(r - 0.3);
  float glow = 0.016 / (d + 0.014) + 0.05 / (d * 6.0 + 0.2);
  color += vec3(0.1, 0.42, 1.0) * glow * 0.6;

  // 고리 몸통의 격자 무늬. 각도를 직접 쓰지 않고 좌표로 끊어 이음매를 없앱니다.
  float band = smoothstep(0.03, 0.022, d);
  vec2 tiles = fract(c * 60.0) - 0.5;
  float cells = smoothstep(0.42, 0.2, max(abs(tiles.x), abs(tiles.y)));
  float shimmer = 0.7 + 0.3 * sin(t * 1.3 + (c.x - c.y) * 16.0);
  // 물에 비친 고리는 무늬 없이 빛덩이로만 남깁니다.
  color += band * vec3(0.3, 0.72, 1.0) * mix(0.55 + 0.75 * cells * shimmer, 0.8, reflected);
  color += smoothstep(0.012, 0.0, d - 0.021) * vec3(0.75, 0.92, 1.0) * 0.5 * (1.0 - reflected);

  // 고리 안쪽은 건너편 어둠이 보입니다.
  color *= mix(0.55, 1.0, smoothstep(0.24, 0.3, r));

  // 양쪽 산. 고리에 가까운 사면에는 푸른 빛이 번집니다.
  float ridge = ridgeHeight(p.x);
  if (p.y < ridge) {
    float toRing = exp(-abs(p.x) * 1.5);
    float grain = fbm(p * vec2(9.0, 22.0));
    float lit = smoothstep(ridge - 0.42, ridge, p.y) * toRing;
    vec3 rock = vec3(0.004, 0.012, 0.045) + vec3(0.04, 0.26, 0.8) * lit * grain * 3.4;
    color = mix(rock, color, smoothstep(0.0, 0.006, p.y - ridge));
  }
  return color;
}

vec3 entrance(vec2 p, float t) {
  if (p.y >= HORIZON) return aboveWater(p, t, 0.0);
  float depth = HORIZON - p.y;
  // 멀리는 잘게, 가까이는 크게 일렁입니다.
  float scale = 1.0 / (depth + 0.09);
  float ripple = noise(vec2(p.x * 2.4 + t * 0.07, scale * 2.6 + t * 0.32)) - 0.5;
  // 수면을 가로 띠로 끊어 띠마다 다르게 어긋나면 비친 빛이 잘게 부서집니다.
  float row = floor(scale * 9.0 + depth * 46.0 + t * 0.7);
  float shred = hash(vec2(row, 4.0)) - 0.5;
  float gap = smoothstep(0.1, 0.5, hash(vec2(row, 9.0)));
  vec2 mirror = vec2(p.x + (ripple * 0.22 + shred * 0.42) * min(depth * 2.4, 1.0), HORIZON + depth * 0.92);
  vec3 color = aboveWater(mirror, t, 1.0) * mix(0.5, 0.16, smoothstep(0.0, 0.9, depth)) * mix(0.45, 1.0, gap);

  float path = exp(-p.x * p.x * (5.0 + 1.2 / (depth + 0.05)));
  float streak = smoothstep(0.54, 0.8, noise(vec2(p.x * 3.0 + ripple * 2.0, row * 0.73)));
  color += vec3(0.06, 0.36, 1.0) * path * streak * 1.25;
  color += stars(vec2(p.x, scale * 0.42) + t * 0.008, 26.0) * vec3(0.5, 0.72, 1.0) * smoothstep(0.9, 0.05, depth);
  return color;
}

/* ---------- 지평선: 광선 적분 블랙홀 ---------- */

const float DISK_INNER = 2.5;
const float DISK_OUTER = 17.0;

vec3 diskEmission(vec3 hit, vec3 rayDir, float t, inout float opacity) {
  float r = length(hit.xz);
  if (r < DISK_INNER || r > DISK_OUTER) return vec3(0.0);
  float angle = atan(hit.z, hit.x) + t * 3.2 / (r + 0.6);
  vec2 around = vec2(cos(angle), sin(angle));
  float bands = noise3(vec3(r * 2.6, around * 1.3));
  float fine = noise3(vec3(r * 8.5 + bands * 1.8, around * 2.4));
  float streaks = 0.32 + bands * 0.8 + fine * 0.5;
  float density = smoothstep(DISK_INNER, DISK_INNER + 0.55, r) * smoothstep(DISK_OUTER, 7.5, r);
  float heat = pow(3.0 / r, 1.45);

  // 다가오는 쪽이 밝아 보이는 상대론적 빛몰이
  vec3 orbital = normalize(vec3(-hit.z, 0.0, hit.x));
  float beta = sqrt(0.5 / r);
  float doppler = 1.0 / (sqrt(1.0 / (1.0 - beta * beta)) * (1.0 - beta * dot(orbital, -rayDir)));
  float intensity = density * heat * streaks * pow(doppler, 2.4);

  float cover = clamp(density * (0.5 + streaks * 0.5), 0.0, 0.92);
  vec3 tint = mix(vec3(0.46, 0.42, 0.78), vec3(1.0, 0.97, 1.0), clamp(intensity * 0.72, 0.0, 1.0));
  vec3 emitted = tint * intensity * 1.7 * (1.0 - opacity);
  opacity += (1.0 - opacity) * cover;
  return emitted;
}

vec3 blackHole(vec2 p, float t, float aspect) {
  // 세로 화면에서 시야가 너무 넓어지면 원반이 늘어나므로 확대 비율에 하한을 둡니다.
  float zoom = max(min(aspect, 1.3) / 1.3, 0.62);
  vec2 screen = p / zoom;
  // 가로 화면은 글이 놓이는 왼쪽 아래를, 세로 화면은 화면 아래쪽 글자리를 비웁니다.
  screen.y -= aspect < 1.0 ? 0.72 : 0.1;

  float elevation = 0.2;
  float distanceFromHole = mix(15.0, 5.0, uFall * uFall);
  vec3 origin = vec3(0.0, sin(elevation), -cos(elevation)) * distanceFromHole;
  vec3 forward = normalize(-origin);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 velocity = normalize(forward * 2.05 + right * screen.x + up * screen.y);

  vec3 position = origin;
  vec3 momentum = cross(position, velocity);
  float h2 = dot(momentum, momentum);
  vec3 color = vec3(0.0);
  float opacity = 0.0;
  bool captured = false;
  bool escaped = false;

  for (int i = 0; i < 70; i++) {
    float r = length(position);
    if (r < 1.0) { captured = true; break; }
    if (r > 34.0 && dot(position, velocity) > 0.0) { escaped = true; break; }
    float dt = clamp(r * 0.13, 0.05, 1.6);
    vec3 previous = position;
    velocity += -1.5 * h2 * position / pow(r, 5.0) * dt;
    position += velocity * dt;
    if (previous.y * position.y < 0.0 && opacity < 0.99) {
      vec3 hit = mix(previous, position, previous.y / (previous.y - position.y));
      color += diskEmission(hit, normalize(velocity), t, opacity);
    }
  }

  // 그림자 가장자리처럼 끝까지 계산하지 못한 광선에는 별을 찍지 않습니다.
  if (escaped) {
    vec2 lensed = screen * (1.0 + 0.2 / max(dot(screen, screen), 0.04));
    color += (1.0 - opacity) * stars(lensed + 3.0, 30.0) * vec3(0.8, 0.86, 1.0) * 0.9;
  }

  // 떨어지는 동안 사방으로 찢어지는 빛줄기
  if (uFall > 0.01) {
    float radius = length(p);
    vec2 around = p / max(radius, 0.001);
    float rays = pow(noise3(vec3(around * 9.0, radius * 1.4 - t * 2.6)), 5.0);
    color += vec3(0.42, 0.56, 1.0) * rays * 7.0 * sin(uFall * 3.14159) * smoothstep(0.08, 0.9, radius);
    color *= 1.0 - smoothstep(0.72, 1.0, uFall);
  }
  return color;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (gl_FragCoord.xy / uResolution - 0.5) * 2.0 * vec2(aspect, 1.0);
  float t = uTime;

  vec3 color = vec3(0.0);
  if (uMix < 0.995) {
    vec2 q = p;
    // 세로 화면에서도 고리가 잘리지 않게 합니다.
    if (aspect < 1.0) q /= max(aspect * 1.25, 0.72);
    color += entrance(q, t) * (1.0 - uMix);
  }
  if (uMix > 0.005) color += blackHole(p, t, aspect) * uMix;

  color = 1.0 - exp(-color * 1.55);
  color *= 1.0 - uDim * 0.62;
  color += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(color, 1.0);
}
`
