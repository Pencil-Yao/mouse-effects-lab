import * as THREE from 'three'
import gsap from 'gsap'
import { TouchTexture } from './touch-texture'
import particleVert from './shaders/particle.vert?raw'
import particleFrag from './shaders/particle.frag?raw'

export interface PixelParticlesSettings {
  image: string
  resolution: number
  size: number
  depth: number
  mouseForce: number
  noiseSpeed: number
  threshold: number
  brightness: number
}

interface PixelSource {
  texture: THREE.CanvasTexture
  width: number
  height: number
}

async function buildPixelSource(url: string, resolution: number): Promise<PixelSource> {
  const image = new Image()
  image.src = url
  await image.decode()

  const scale = resolution / Math.max(image.naturalWidth, image.naturalHeight)
  const width = Math.max(4, Math.round(image.naturalWidth * scale))
  const height = Math.max(4, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, width, height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return { texture, width, height }
}

/**
 * Image → instanced particle field.
 * One quad is instanced once per source pixel; the vertex shader reads the
 * source pixel and the pointer ripple texture to displace each instance.
 * Adapted from a-reactive-particle-system (MIT).
 */
export class PixelParticlesEngine {
  private canvas: HTMLCanvasElement
  private getSettings: () => PixelParticlesSettings
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private touch = new TouchTexture()
  private raycaster = new THREE.Raycaster()
  private ndc = new THREE.Vector2()
  private pointerUv = new THREE.Vector2(0.5, 0.5)
  private mesh: THREE.Mesh | null = null
  private hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private intersection = new THREE.Vector3()
  private material: THREE.ShaderMaterial | null = null
  private sourceTexture: THREE.CanvasTexture | null = null
  private observer: ResizeObserver
  private raf = 0
  private last = performance.now()
  private elapsed = 0
  private intro = { t: 0 }
  private destroyed = false

  constructor(canvas: HTMLCanvasElement, getSettings: () => PixelParticlesSettings) {
    this.canvas = canvas
    this.getSettings = getSettings
    const rect = canvas.getBoundingClientRect()

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setSize(rect.width || 600, rect.height || 340, false)
    this.renderer.setClearColor(0x000000, 0)

    this.camera = new THREE.PerspectiveCamera(
      50,
      (rect.width || 600) / (rect.height || 340),
      1,
      10000,
    )
    this.camera.position.z = 200


    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerdown', this.onPointerMove)
    window.addEventListener('blur', this.onBlur)

    gsap.to(this.intro, { t: 1, duration: 1.5, ease: 'power3.out' })
    this.build().then(() => {
      if (this.destroyed) return
      this.resize()
      this.raf = requestAnimationFrame(this.loop)
    })
  }

  private async build() {
    const settings = this.getSettings()
    const source = await buildPixelSource(settings.image, Math.round(settings.resolution))
    if (this.destroyed) {
      source.texture.dispose()
      return
    }

    this.sourceTexture = source.texture
    const { width, height } = source
    const total = width * height

    const base = new THREE.PlaneGeometry(1, 1)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = base.index
    geometry.setAttribute('position', base.getAttribute('position'))
    geometry.setAttribute('uv', base.getAttribute('uv'))

    const offsets = new Float32Array(total * 3)
    const indices = new Float32Array(total)
    for (let i = 0; i < total; i++) {
      offsets[i * 3] = i % width
      offsets[i * 3 + 1] = Math.floor(i / width)
      indices[i] = i
    }
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3))
    geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1))
    geometry.instanceCount = total

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      uniforms: {
        uTime: { value: 0 },
        uRandom: { value: 1.1 },
        uSize: { value: settings.size },
        uDepth: { value: settings.depth },
        uForce: { value: settings.mouseForce },
        uNoiseSpeed: { value: settings.noiseSpeed },
        uTextureSize: { value: new THREE.Vector2(width, height) },
        uTexture: { value: source.texture },
        uRayTexture: { value: this.touch.texture },
        uPointer: { value: this.pointerUv },
        uThreshold: { value: settings.threshold },
        uBrightness: { value: settings.brightness },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
    this.resize()
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.mesh) return
    const rect = this.canvas.getBoundingClientRect()
    this.ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.ndc, this.camera)
    if (!this.raycaster.ray.intersectPlane(this.hitPlane, this.intersection)) return
    const size = this.material?.uniforms.uTextureSize.value as THREE.Vector2
    if (!size) return
    const scale = this.mesh.scale.x || 1
    const u = this.intersection.x / (scale * size.x) + 0.5
    const v = this.intersection.y / (scale * size.y) + 0.5
    const cu = Math.min(1, Math.max(0, u))
    const cv = Math.min(1, Math.max(0, v))
    this.pointerUv.set(cu, cv)
    this.touch.addTouch(cu, cv)
  }

  private onBlur = () => {
    this.ndc.set(0, 0)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.camera.aspect = rect.width / rect.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(rect.width, rect.height, false)

    if (this.mesh) {
      const fovHeight =
        2 * Math.tan(((this.camera.fov * Math.PI) / 180) / 2) * this.camera.position.z
      const height = (this.material?.uniforms.uTextureSize.value as THREE.Vector2).y
      const scale = (fovHeight / Math.max(height, 1)) * 0.92
      this.mesh.scale.set(scale, scale, 1)
    }
  }

  private loop = (now: number) => {
    const settings = this.getSettings()
    const dt = Math.min((now - this.last) / 1000, 1 / 24)
    this.last = now
    this.elapsed += dt

    if (this.material) {
      const u = this.material.uniforms
      const t = this.intro.t
      u.uTime.value = this.elapsed
      u.uSize.value = 0.15 + settings.size * t
      u.uDepth.value = settings.depth * t
      u.uForce.value = settings.mouseForce
      u.uNoiseSpeed.value = settings.noiseSpeed
      u.uThreshold.value = settings.threshold
      u.uBrightness.value = settings.brightness
    }

    this.touch.update()
    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerMove)
    window.removeEventListener('blur', this.onBlur)
    gsap.killTweensOf(this.intro)
    this.touch.destroy()
    this.sourceTexture?.dispose()
    this.material?.dispose()
    this.mesh?.geometry.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
