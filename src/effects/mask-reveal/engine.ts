import * as THREE from 'three'
import waveVert from './shaders/wave.vert?raw'
import waveFrag from './shaders/wave.frag?raw'
import maskVert from './shaders/mask.vert?raw'
import maskFrag from './shaders/mask.frag?raw'

export interface MaskRevealSettings {
  intensity: number
  scale: number
  viscosity: number
  decay: number
  revealSize: number
  edgeSoftness: number
  distortionStrength: number
  lightIntensity: number
}

const RES = 512

export class MaskRevealEngine {
  private canvas: HTMLCanvasElement
  private getSettings: () => MaskRevealSettings
  private renderer: THREE.WebGLRenderer
  private simScene = new THREE.Scene()
  private simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: THREE.Mesh
  private revealScene = new THREE.Scene()
  private revealCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private revealQuad: THREE.Mesh
  private targets: THREE.WebGLRenderTarget[]
  private waveMaterial: THREE.ShaderMaterial
  private maskMaterial: THREE.ShaderMaterial
  private baseTexture: THREE.Texture | null = null
  private revealTexture: THREE.Texture | null = null
  private baseAspect = 1
  private revealAspect = 1
  private current = 0
  private pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5 }
  private observer: ResizeObserver
  private raf = 0
  private last = performance.now()

  constructor(canvas: HTMLCanvasElement, getSettings: () => MaskRevealSettings) {
    this.canvas = canvas
    this.getSettings = getSettings
    const rect = canvas.getBoundingClientRect()

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setSize(rect.width || 800, rect.height || 430, false)
    this.renderer.setClearColor(0x000000, 0)

    const options: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
    this.targets = [0, 1, 2].map(() => new THREE.WebGLRenderTarget(RES, RES, options))
    this.targets.forEach((rt) => {
      this.renderer.setRenderTarget(rt)
      this.renderer.clear()
    })
    this.renderer.setRenderTarget(null)

    this.waveMaterial = new THREE.ShaderMaterial({
      vertexShader: waveVert,
      fragmentShader: waveFrag,
      uniforms: {
        uPrevState: { value: null },
        uCurrentState: { value: null },
        uResolution: { value: new THREE.Vector2(RES, RES) },
        uViscosity: { value: 0.6 },
        uDecay: { value: 0.96 },
        uAspect: { value: 1 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRadius: { value: 0.1 },
        uIntensity: { value: 0.73 },
        uMouseVelocity: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.maskMaterial = new THREE.ShaderMaterial({
      vertexShader: maskVert,
      fragmentShader: maskFrag,
      uniforms: {
        uBaseTexture: { value: null },
        uRevealTexture: { value: null },
        uDisplacement: { value: null },
        uSimResolution: { value: new THREE.Vector2(RES, RES) },
        uBaseAspect: { value: 1 },
        uRevealAspect: { value: 1 },
        uViewportAspect: { value: 1 },
        uRevealSize: { value: 1.9 },
        uEdgeSoftness: { value: 0.1 },
        uDistortionStrength: { value: 0.002 },
        uLightIntensity: { value: 0.05 },
        uSpecularPower: { value: 4 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.waveMaterial)
    this.simScene.add(this.quad)
    this.revealQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.maskMaterial)
    this.revealScene.add(this.revealQuad)

    const loader = new THREE.TextureLoader()
    loader.load('art/trail/32.jpg', (texture) => {
      texture.minFilter = THREE.LinearFilter
      this.baseTexture = texture
      const img = texture.image as HTMLImageElement
      this.baseAspect = img.naturalWidth / img.naturalHeight
    })
    loader.load('art/trail/36.jpg', (texture) => {
      texture.minFilter = THREE.LinearFilter
      this.revealTexture = texture
      const img = texture.image as HTMLImageElement
      this.revealAspect = img.naturalWidth / img.naturalHeight
    })

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerenter', this.onEnter)
    canvas.addEventListener('pointerdown', this.onMove)
    window.addEventListener('blur', this.onBlur)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.renderer.setSize(rect.width, rect.height, false)
    const aspect = rect.width / rect.height
    this.waveMaterial.uniforms.uAspect.value = aspect
    this.maskMaterial.uniforms.uViewportAspect.value = aspect
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = (event.clientX - rect.left) / rect.width
    this.pointer.y = 1 - (event.clientY - rect.top) / rect.height
  }

  private onEnter = (event: PointerEvent) => {
    this.onMove(event)
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
  }

  private onBlur = () => {
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
  }

  private loop = (now: number) => {
    const s = this.getSettings()
    const dt = Math.min((now - this.last) / 1000, 1 / 30)
    this.last = now

    const dx = this.pointer.x - this.pointer.prevX
    const dy = this.pointer.y - this.pointer.prevY
    const velocity = Math.hypot(dx, dy)

    const current = this.current
    const prev = (current + 2) % 3
    const next = (current + 1) % 3

    const wu = this.waveMaterial.uniforms
    wu.uPrevState.value = this.targets[prev].texture
    wu.uCurrentState.value = this.targets[current].texture
    wu.uViscosity.value = s.viscosity
    wu.uDecay.value = s.decay
    wu.uMouse.value.set(this.pointer.x, this.pointer.y)
    wu.uPrevMouse.value.set(this.pointer.prevX, this.pointer.prevY)
    wu.uRadius.value = s.scale
    wu.uIntensity.value = s.intensity
    wu.uMouseVelocity.value = velocity

    this.renderer.setRenderTarget(this.targets[next])
    this.renderer.render(this.simScene, this.simCamera)
    this.current = next
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y

    if (this.baseTexture && this.revealTexture) {
      const mu = this.maskMaterial.uniforms
      mu.uBaseTexture.value = this.baseTexture
      mu.uRevealTexture.value = this.revealTexture
      mu.uBaseAspect.value = this.baseAspect
      mu.uRevealAspect.value = this.revealAspect
      mu.uDisplacement.value = this.targets[next].texture
      mu.uRevealSize.value = s.revealSize
      mu.uEdgeSoftness.value = s.edgeSoftness
      mu.uDistortionStrength.value = s.distortionStrength
      mu.uLightIntensity.value = s.lightIntensity
    }

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.revealScene, this.revealCamera)
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerenter', this.onEnter)
    this.canvas.removeEventListener('pointerdown', this.onMove)
    window.removeEventListener('blur', this.onBlur)
    this.targets.forEach((rt) => rt.dispose())
    this.waveMaterial.dispose()
    this.maskMaterial.dispose()
    this.quad.geometry.dispose()
    this.revealQuad.geometry.dispose()
    this.baseTexture?.dispose()
    this.revealTexture?.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
