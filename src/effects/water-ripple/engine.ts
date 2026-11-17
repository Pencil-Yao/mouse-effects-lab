import * as THREE from 'three'
import waveVert from './shaders/wave.vert?raw'
import waveFrag from './shaders/wave.frag?raw'
import imageVert from './shaders/image.vert?raw'
import imageFrag from './shaders/image.frag?raw'

export interface WaterRippleSettings {
  image: string
  intensity: number
  scale: number
  viscosity: number
  decay: number
  distortionStrength: number
  aberration: number
  lightIntensity: number
  specularPower: number
}

const RES = 512

/**
 * Two-stage GPU effect:
 *  1. a ping-pong wave-equation field receives pointer ripples;
 *  2. the image shader derives a normal from that field and refracts the
 *     photo, adding chromatic aberration and a specular highlight.
 * Clean-room reconstruction of the unlicensed mouse-effects implementation.
 */
export class WaterRippleEngine {
  private canvas: HTMLCanvasElement
  private getSettings: () => WaterRippleSettings
  private renderer: THREE.WebGLRenderer
  private simScene = new THREE.Scene()
  private simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: THREE.Mesh
  private imageScene = new THREE.Scene()
  private imageCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private imageQuad: THREE.Mesh
  private targets: THREE.WebGLRenderTarget[] = []
  private waveMaterial: THREE.ShaderMaterial
  private imageMaterial: THREE.ShaderMaterial
  private textures = new Map<string, { texture: THREE.Texture; aspect: number }>()
  private current = 0
  private pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5 }
  private observer: ResizeObserver
  private raf = 0
  private last = performance.now()
  private destroyed = false

  constructor(canvas: HTMLCanvasElement, getSettings: () => WaterRippleSettings) {
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
    ;[this.targets[0], this.targets[1], this.targets[2]].forEach((rt) => {
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
        uViscosity: { value: 0.89 },
        uDecay: { value: 0.98 },
        uAspect: { value: 1 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRadius: { value: 0.1 },
        uIntensity: { value: 0.24 },
        uMouseVelocity: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.imageMaterial = new THREE.ShaderMaterial({
      vertexShader: imageVert,
      fragmentShader: imageFrag,
      uniforms: {
        uTexture: { value: null },
        uDisplacement: { value: null },
        uSimResolution: { value: new THREE.Vector2(RES, RES) },
        uImageAspect: { value: 1 },
        uViewportAspect: { value: 1 },
        uDistortionStrength: { value: 0.03 },
        uAberration: { value: 0.003 },
        uLightIntensity: { value: 0.12 },
        uSpecularPower: { value: 8 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.waveMaterial)
    this.simScene.add(this.quad)
    this.imageQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.imageMaterial)
    this.imageScene.add(this.imageQuad)

    const loader = new THREE.TextureLoader()
    for (const url of [
      'art/trail/31.jpg',
      'art/trail/33.jpg',
      'art/trail/35.jpg',
      'art/trail/37.jpg',
    ]) {
      loader.load(url, (texture) => {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        const img = texture.image as HTMLImageElement
        this.textures.set(url, {
          texture,
          aspect: img.naturalWidth / img.naturalHeight,
        })
      })
    }

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
    this.imageMaterial.uniforms.uViewportAspect.value = aspect
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

    const selected = this.textures.get(s.image) ?? this.textures.values().next().value
    if (selected) {
      const iu = this.imageMaterial.uniforms
      iu.uTexture.value = selected.texture
      iu.uImageAspect.value = selected.aspect
      iu.uDisplacement.value = this.targets[next].texture
      iu.uDistortionStrength.value = s.distortionStrength
      iu.uAberration.value = s.aberration
      iu.uLightIntensity.value = s.lightIntensity
      iu.uSpecularPower.value = s.specularPower
    }

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.imageScene, this.imageCamera)
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerenter', this.onEnter)
    this.canvas.removeEventListener('pointerdown', this.onMove)
    window.removeEventListener('blur', this.onBlur)
    this.targets.forEach((rt) => rt.dispose())
    this.waveMaterial.dispose()
    this.imageMaterial.dispose()
    this.quad.geometry.dispose()
    this.imageQuad.geometry.dispose()
    this.textures.forEach(({ texture }) => texture.dispose())
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    void this.destroyed
  }
}
