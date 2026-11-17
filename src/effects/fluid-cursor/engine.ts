import * as THREE from 'three'
import baseVert from './shaders/base.vert?raw'
import splatFrag from './shaders/splat.frag?raw'
import advectionFrag from './shaders/advection.frag?raw'
import divergenceFrag from './shaders/divergence.frag?raw'
import pressureFrag from './shaders/pressure.frag?raw'
import gradientSubtractFrag from './shaders/gradientSubtract.frag?raw'
import curlFrag from './shaders/curl.frag?raw'
import vorticityFrag from './shaders/vorticity.frag?raw'
import clearFrag from './shaders/clear.frag?raw'
import displayFrag from './shaders/display.frag?raw'

export interface FluidSettings {
  splatRadius: number
  force: number
  velocityFade: number
  dyeFade: number
  swirl: number
  dyeIntensity: number
  pressureIterations: number
}

const SIM_RES = 128
const DYE_RES = 512
const PRESSURE_COEFFICIENT = 0.1
const COLOR_RATE = 10

interface FBO {
  read: THREE.WebGLRenderTarget
  write: THREE.WebGLRenderTarget
  swap: () => void
}

function doubleFBO(width: number, height: number): FBO {
  const options: THREE.RenderTargetOptions = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  }
  let a = new THREE.WebGLRenderTarget(width, height, options)
  let b = new THREE.WebGLRenderTarget(width, height, options)
  return {
    get read() {
      return a
    },
    get write() {
      return b
    },
    swap() {
      const t = a
      a = b
      b = t
    },
  }
}

function singleFBO(width: number, height: number) {
  return new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  })
}

function hueColor(t: number): [number, number, number] {
  const h = ((t % 1) + 1) % 1
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const q = 1 - f
  const table: [number, number, number][] = [
    [1, f, 0],
    [q, 1, 0],
    [0, 1, f],
    [0, q, 1],
    [f, 0, 1],
    [1, 0, q],
  ]
  return table[i % 6]
}

/**
 * GPU fluid cursor: advection + pressure projection + vorticity
 * confinement, with a dye field injected by pointer movement.
 * Adapted from webgl-fluid-cursor (MIT, Shahroz Adnan).
 */
export class FluidCursorEngine {
  private canvas: HTMLCanvasElement
  private getSettings: () => FluidSettings
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: THREE.Mesh
  private velocity = doubleFBO(SIM_RES, SIM_RES)
  private dye = doubleFBO(DYE_RES, DYE_RES)
  private divergence = singleFBO(SIM_RES, SIM_RES)
  private curl = singleFBO(SIM_RES, SIM_RES)
  private pressure = doubleFBO(SIM_RES, SIM_RES)
  private simTexel = new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES)
  private dyeTexel = new THREE.Vector2(1 / DYE_RES, 1 / DYE_RES)
  private materials: THREE.ShaderMaterial[] = []
  private splatMaterial: THREE.ShaderMaterial
  private advectionMaterial: THREE.ShaderMaterial
  private divergenceMaterial: THREE.ShaderMaterial
  private pressureMaterial: THREE.ShaderMaterial
  private gradientMaterial: THREE.ShaderMaterial
  private curlMaterial: THREE.ShaderMaterial
  private vorticityMaterial: THREE.ShaderMaterial
  private clearMaterial: THREE.ShaderMaterial
  private displayMaterial: THREE.ShaderMaterial
  private pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, moved: false }
  private inside = false
  private currentHue = Math.random()
  private colorTimer = 0
  private observer: ResizeObserver
  private raf = 0
  private last = performance.now()
  private destroyed = false

  constructor(canvas: HTMLCanvasElement, getSettings: () => FluidSettings) {
    this.canvas = canvas
    this.getSettings = getSettings
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
    this.renderer.autoClear = false
    this.renderer.setPixelRatio(1)
    const rect = canvas.getBoundingClientRect()
    this.renderer.setSize(rect.width || 800, rect.height || 430, false)
    this.renderer.setClearColor(0x000000, 0)

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
    this.scene.add(this.quad)

    const material = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({
        vertexShader: baseVert,
        fragmentShader,
        uniforms,
        depthTest: false,
        depthWrite: false,
      })

    this.splatMaterial = material(splatFrag, {
      texelSize: { value: this.simTexel },
      uTarget: { value: null },
      aspectRatio: { value: (rect.width || 800) / (rect.height || 430) },
      color: { value: new THREE.Vector3() },
      point: { value: new THREE.Vector2() },
      radius: { value: this.correctRadius(this.getSettings().splatRadius) },
    })
    this.advectionMaterial = material(advectionFrag, {
      texelSize: { value: this.simTexel },
      uVelocity: { value: null },
      uSource: { value: null },
      dt: { value: 0 },
      dissipation: { value: 1 },
    })
    this.divergenceMaterial = material(divergenceFrag, {
      texelSize: { value: this.simTexel },
      uVelocity: { value: null },
    })
    this.pressureMaterial = material(pressureFrag, {
      texelSize: { value: this.simTexel },
      uPressure: { value: null },
      uDivergence: { value: null },
    })
    this.gradientMaterial = material(gradientSubtractFrag, {
      texelSize: { value: this.simTexel },
      uPressure: { value: null },
      uVelocity: { value: null },
    })
    this.curlMaterial = material(curlFrag, {
      texelSize: { value: this.simTexel },
      uVelocity: { value: null },
    })
    this.vorticityMaterial = material(vorticityFrag, {
      texelSize: { value: this.simTexel },
      uVelocity: { value: null },
      uCurl: { value: null },
      curlStrength: { value: 14 },
      dt: { value: 0 },
    })
    this.clearMaterial = material(clearFrag, {
      texelSize: { value: this.simTexel },
      uTexture: { value: null },
      value: { value: PRESSURE_COEFFICIENT },
    })
    this.displayMaterial = material(displayFrag, {
      texelSize: { value: this.dyeTexel },
      uDye: { value: null },
    })
    this.displayMaterial.transparent = true
    this.displayMaterial.blending = THREE.CustomBlending
    this.displayMaterial.blendSrc = THREE.OneFactor
    this.displayMaterial.blendDst = THREE.OneMinusSrcAlphaFactor
    this.displayMaterial.blendEquation = THREE.AddEquation

    this.materials = [
      this.splatMaterial,
      this.advectionMaterial,
      this.divergenceMaterial,
      this.pressureMaterial,
      this.gradientMaterial,
      this.curlMaterial,
      this.vorticityMaterial,
      this.clearMaterial,
      this.displayMaterial,
    ]

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerenter', this.onPointerEnter)
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    window.addEventListener('blur', this.onBlur)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  private correctRadius(radius: number) {
    const rect = this.canvas.getBoundingClientRect()
    const aspect = (rect.width || 1) / (rect.height || 1)
    return aspect > 1 ? radius * aspect : radius
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.renderer.setSize(rect.width, rect.height, false)
    const aspect = rect.width / rect.height
    this.splatMaterial.uniforms.aspectRatio.value = aspect
    this.splatMaterial.uniforms.radius.value = this.correctRadius(
      this.getSettings().splatRadius,
    )
  }

  private setPointer(clientX: number, clientY: number, reset: boolean) {
    const rect = this.canvas.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = 1 - (clientY - rect.top) / rect.height
    if (reset || !this.inside) {
      this.pointer.prevX = x
      this.pointer.prevY = y
      this.inside = true
    } else {
      this.pointer.prevX = this.pointer.x
      this.pointer.prevY = this.pointer.y
    }
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.moved = true
  }

  private onPointerMove = (e: PointerEvent) => this.setPointer(e.clientX, e.clientY, false)
  private onPointerEnter = (e: PointerEvent) => this.setPointer(e.clientX, e.clientY, true)
  private onPointerDown = (e: PointerEvent) => this.setPointer(e.clientX, e.clientY, false)
  private onPointerLeave = () => {
    this.inside = false
    this.pointer.moved = false
  }
  private onBlur = () => {
    this.inside = false
    this.pointer.moved = false
  }

  private pass(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = material
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
  }

  private applySplat(dt: number) {
    if (!this.pointer.moved) return
    this.pointer.moved = false
    const s = this.getSettings()
    const p = this.pointer
    const aspect = this.splatMaterial.uniforms.aspectRatio.value as number
    const dx = (p.x - p.prevX) * aspect / Math.max(dt, 1 / 240)
    const dy = (p.y - p.prevY) / Math.max(dt, 1 / 240)
    const speed = Math.min(Math.hypot(dx, dy), 6)
    if (speed < 0.02) return

    this.colorTimer += dt * COLOR_RATE
    if (this.colorTimer >= 1) {
      this.colorTimer %= 1
      this.currentHue = Math.random()
    }

    this.splatMaterial.uniforms.uTarget.value = this.velocity.read.texture
    this.splatMaterial.uniforms.point.value.set(p.x, p.y)
    this.splatMaterial.uniforms.radius.value = this.correctRadius(s.splatRadius)
    this.splatMaterial.uniforms.color.value.set(dx * s.force, dy * s.force, 0)
    this.pass(this.splatMaterial, this.velocity.write)
    this.velocity.swap()

    const intensity = Math.min(speed, 1.5) * s.dyeIntensity
    const [r, g, b] = hueColor(this.currentHue)
    this.splatMaterial.uniforms.uTarget.value = this.dye.read.texture
    this.splatMaterial.uniforms.color.value.set(r * intensity, g * intensity, b * intensity)
    this.pass(this.splatMaterial, this.dye.write)
    this.dye.swap()
  }

  private loop = (now: number) => {
    const s = this.getSettings()
    const dt = Math.min((now - this.last) / 1000, 1 / 30)
    this.last = now

    this.applySplat(dt)

    this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.pass(this.curlMaterial, this.curl)

    this.vorticityMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.vorticityMaterial.uniforms.uCurl.value = this.curl.texture
    this.vorticityMaterial.uniforms.curlStrength.value = s.swirl
    this.vorticityMaterial.uniforms.dt.value = dt
    this.pass(this.vorticityMaterial, this.velocity.write)
    this.velocity.swap()

    this.divergenceMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.pass(this.divergenceMaterial, this.divergence)

    this.clearMaterial.uniforms.uTexture.value = this.pressure.read.texture
    this.pass(this.clearMaterial, this.pressure.write)
    this.pressure.swap()

    const iterations = Math.round(s.pressureIterations)
    for (let i = 0; i < iterations; i++) {
      this.pressureMaterial.uniforms.uPressure.value = this.pressure.read.texture
      this.pressureMaterial.uniforms.uDivergence.value = this.divergence.texture
      this.pass(this.pressureMaterial, this.pressure.write)
      this.pressure.swap()
    }

    this.gradientMaterial.uniforms.uPressure.value = this.pressure.read.texture
    this.gradientMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.pass(this.gradientMaterial, this.velocity.write)
    this.velocity.swap()

    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture
    this.advectionMaterial.uniforms.dt.value = dt
    this.advectionMaterial.uniforms.dissipation.value = s.velocityFade
    this.pass(this.advectionMaterial, this.velocity.write)
    this.velocity.swap()

    this.advectionMaterial.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectionMaterial.uniforms.uSource.value = this.dye.read.texture
    this.advectionMaterial.uniforms.dissipation.value = s.dyeFade
    this.pass(this.advectionMaterial, this.dye.write)
    this.dye.swap()

    this.displayMaterial.uniforms.uDye.value = this.dye.read.texture
    this.renderer.setRenderTarget(null)
    this.renderer.clear()
    this.quad.material = this.displayMaterial
    this.renderer.render(this.scene, this.camera)

    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerenter', this.onPointerEnter)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    window.removeEventListener('blur', this.onBlur)
    ;[this.velocity.read, this.velocity.write, this.dye.read, this.dye.write,
      this.divergence, this.curl, this.pressure.read, this.pressure.write].forEach((rt) =>
      rt.dispose(),
    )
    this.materials.forEach((m) => m.dispose())
    this.quad.geometry.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    if (this.destroyed) return
  }
}
