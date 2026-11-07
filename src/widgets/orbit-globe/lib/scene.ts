import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import type { ScenePoint } from '@/entities/satellite'

export interface GlobeOrbit {
  id: number
  path: ScenePoint[]
  military: boolean
}

export interface GlobeColors {
  line: string
  lineStrong: string
  paper: string
  signal: string
  alert: string
}

export interface GlobeScene {
  /** 궤도선과 표시를 새로 만듭니다. 표시하는 위성이 바뀔 때만 부릅니다. */
  setOrbits(orbits: GlobeOrbit[]): void
  /** 이미 만든 표시만 옮깁니다. 위치를 모르면 숨깁니다. */
  setPositions(positions: Map<number, ScenePoint | null>): void
  setColors(colors: GlobeColors): void
  setEarthRotation(radians: number): void
  rotate(radians: number): void
  zoom(factor: number): void
  setAutoRotate(on: boolean): void
  resize(width: number, height: number): void
  dispose(): void
}

const GRATICULE_STEP = 30
const SEGMENTS = 96

/** 위도·경도 눈금선. 지구본의 회전을 읽을 수 있게 적도와 본초 자오선을 함께 그립니다. */
function graticule(): BufferGeometry {
  const points: number[] = []
  const at = (lat: number, lon: number) => {
    const phi = (lat * Math.PI) / 180
    const lambda = (lon * Math.PI) / 180
    return [Math.cos(phi) * Math.cos(lambda), Math.sin(phi), -Math.cos(phi) * Math.sin(lambda)]
  }
  for (let lat = -60; lat <= 60; lat += GRATICULE_STEP) {
    for (let i = 0; i < SEGMENTS; i++) points.push(...at(lat, (i / SEGMENTS) * 360), ...at(lat, ((i + 1) / SEGMENTS) * 360))
  }
  for (let lon = 0; lon < 360; lon += GRATICULE_STEP) {
    for (let i = 0; i < SEGMENTS / 2; i++) points.push(...at(-90 + (i / (SEGMENTS / 2)) * 180, lon), ...at(-90 + ((i + 1) / (SEGMENTS / 2)) * 180, lon))
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points, 3))
}

/**
 * three.js 장면을 만듭니다. 컴포넌트가 이 파일을 늦게 불러와 three.js는 3D 보기를 열 때만 내려받습니다.
 * WebGL을 쓸 수 없으면 예외를 던지고, 호출한 쪽이 글 안내로 대신합니다.
 */
export function createGlobeScene(canvas: HTMLCanvasElement, colors: GlobeColors): GlobeScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  try {
    return buildScene(renderer, canvas, colors)
  } catch (error) {
    // 렌더러는 만들었는데 나머지 준비가 실패하면, 보기를 여닫을 때마다 WebGL 맥락이 쌓이지 않게 바로 정리합니다.
    renderer.dispose()
    throw error
  }
}

function buildScene(renderer: WebGLRenderer, canvas: HTMLCanvasElement, colors: GlobeColors): GlobeScene {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, 0.1, 200)
  camera.position.set(0, 4, 18)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 2.5
  controls.maxDistance = 40
  controls.autoRotateSpeed = 0.6

  // 지구는 바탕색 구로 뒤쪽 궤도를 가리고, 그 위에 눈금선을 그립니다.
  const earth = new Group()
  const occluder = new Mesh(
    new SphereGeometry(0.995, 64, 32),
    new MeshBasicMaterial({ color: colors.paper }),
  )
  const gridMaterial = new LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.9 })
  const grid = new LineSegments(graticule(), gridMaterial)
  earth.add(occluder, grid)
  scene.add(earth)

  const orbitGroup = new Group()
  scene.add(orbitGroup)
  const orbitMaterial = new LineBasicMaterial({ color: colors.signal, transparent: true, opacity: 0.55 })
  const militaryOrbitMaterial = new LineBasicMaterial({ color: colors.alert, transparent: true, opacity: 0.7 })
  // 색만으로 구분하지 않도록 군사 위성은 마름모(팔면체), 나머지는 구로 표시합니다(KWCAG 5.4.1).
  const markerGeometry = new SphereGeometry(0.06, 12, 8)
  const militaryGeometry = new OctahedronGeometry(0.1)
  const markerMaterial = new MeshBasicMaterial({ color: colors.signal })
  const militaryMarkerMaterial = new MeshBasicMaterial({ color: colors.alert })

  let width = 1
  let height = 1
  let frame = 0
  let running = true
  const markers = new Map<number, Mesh>()

  function clearOrbits(): void {
    // 지우면서 돌면 목록이 줄어들므로 맨 앞부터 하나씩 뺍니다.
    while (orbitGroup.children.length > 0) {
      const child = orbitGroup.children[0]!
      orbitGroup.remove(child)
      if (child instanceof Line) child.geometry.dispose()
    }
    markers.clear()
  }

  function render(): void {
    if (!running) return
    controls.update()
    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }
  frame = requestAnimationFrame(render)

  return {
    setOrbits(orbits) {
      clearOrbits()
      for (const orbit of orbits) {
        if (orbit.path.length > 1) {
          const geometry = new BufferGeometry().setFromPoints(orbit.path.map(([x, y, z]) => new Vector3(x, y, z)))
          orbitGroup.add(new Line(geometry, orbit.military ? militaryOrbitMaterial : orbitMaterial))
        }
        // 표시는 공용 도형과 재질을 쓰므로 만들고 지우는 비용이 작고, 위치는 setPositions가 옮깁니다.
        const marker = new Mesh(
          orbit.military ? militaryGeometry : markerGeometry,
          orbit.military ? militaryMarkerMaterial : markerMaterial,
        )
        marker.visible = false
        markers.set(orbit.id, marker)
        orbitGroup.add(marker)
      }
    },
    setPositions(positions) {
      for (const [id, marker] of markers) {
        const position = positions.get(id)
        marker.visible = Boolean(position)
        if (position) marker.position.set(...position)
      }
    },
    setColors(next) {
      ;(occluder.material as MeshBasicMaterial).color.set(next.paper)
      gridMaterial.color.set(next.line)
      orbitMaterial.color.set(next.signal)
      markerMaterial.color.set(next.signal)
      militaryOrbitMaterial.color.set(next.alert)
      militaryMarkerMaterial.color.set(next.alert)
    },
    setEarthRotation(radians) {
      earth.rotation.y = radians
    },
    rotate(radians) {
      const offset = camera.position.clone().sub(controls.target)
      offset.applyAxisAngle(new Vector3(0, 1, 0), radians)
      camera.position.copy(controls.target).add(offset)
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target)
      const distance = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor))
      camera.position.copy(controls.target).add(offset.setLength(distance))
    },
    setAutoRotate(on) {
      controls.autoRotate = on
      controls.enableDamping = on
    },
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth)
      height = Math.max(1, nextHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    },
    dispose() {
      running = false
      cancelAnimationFrame(frame)
      clearOrbits()
      controls.dispose()
      grid.geometry.dispose()
      occluder.geometry.dispose()
      markerGeometry.dispose()
      militaryGeometry.dispose()
      for (const material of [gridMaterial, orbitMaterial, militaryOrbitMaterial, markerMaterial, militaryMarkerMaterial]) material.dispose()
      ;(occluder.material as Material).dispose()
      renderer.dispose()
    },
  }
}
