import * as THREE from 'three'
import fieldVert from './shaders/field.vert?raw'
import fieldFrag from './shaders/field.frag?raw'

export interface ShaderTextSettings {
  text: string
  warp: number
  intensity: number
  brushRadius: number
  decay: number
  lowColor: string
  highColor: string
}

const GRID = 160
const TEXT_W = 1024
const TEXT_H = 512

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ]
}

/**
 * A 160×160 RGBA float texture is the whole interaction state:
 * RG = flow direction, B = speed. JavaScript writes deposits and lets the
 * field decay; the fragment shader offsets its UV by that flow and samples a
 * text canvas, producing a liquid, speed-coloured trail.
 */
export class ShaderTextEngine {
  private canvas: HTMLCanvasElement
  private getSettings: () => ShaderTextSettings
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: THREE.Mesh
  private material: THREE.ShaderMaterial
  private data = new Float32Array(GRID * GRID * 4)
  private texture: THREE.DataTexture
  private textCanvas: HTMLCanvasElement
  private textTexture: THREE.CanvasTexture
  private lastText = ''
  private pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, moved: false }
  private observer: ResizeObserver
  private raf = 0
  private last = performance.now()
  private elapsed = 0

  constructor(canvas: HTMLCanvasElement, getSettings: () => ShaderTextSettings) {
    this.canvas = canvas
    this.getSettings = getSettings
    const rect = canvas.getBoundingClientRect()

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setSize(rect.width || 800, rect.height || 340, false)
    this.renderer.setClearColor(0x05060a, 1)

    this.texture = new THREE.DataTexture(
      this.data,
      GRID,
      GRID,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.needsUpdate = true

    this.textCanvas = document.createElement('canvas')
    this.textCanvas.width = TEXT_W
    this.textCanvas.height = TEXT_H
    this.textTexture = new THREE.CanvasTexture(this.textCanvas)
    this.textTexture.minFilter = THREE.LinearFilter
    this.textTexture.magFilter = THREE.LinearFilter
    this.textTexture.needsUpdate = true
    this.drawText(getSettings().text)

    this.material = new THREE.ShaderMaterial({
      vertexShader: fieldVert,
      fragmentShader: fieldFrag,
      uniforms: {
        uTrail: { value: this.texture },
        uText: { value: this.textTexture },
        uTexel: { value: new THREE.Vector2(1 / GRID, 1 / GRID) },
        uWarp: { value: 0.55 },
        uIntensity: { value: 1.4 },
        uTime: { value: 0 },
        uViewportAspect: { value: (rect.width || 800) / (rect.height || 340) },
        uTextAspect: { value: TEXT_W / TEXT_H },
        uLow: { value: new THREE.Vector3(...hexToRgb('#3b82f6')) },
        uHigh: { value: new THREE.Vector3(...hexToRgb('#a78bfa')) },
        uBg: { value: new THREE.Vector3(0.02, 0.024, 0.04) },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.scene.add(this.quad)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerenter', this.onEnter)
    canvas.addEventListener('pointerdown', this.onMove)
    window.addEventListener('blur', this.onBlur)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  private drawText(text: string) {
    const ctx = this.textCanvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, TEXT_W, TEXT_H)
    const label = (text || 'shader').slice(0, 26)
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '4px'
    let size = 190
    ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`
    while (ctx.measureText(label).width > TEXT_W * 0.88 && size > 40) {
      size -= 6
      ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`
    }
    ctx.fillText(label, TEXT_W / 2, TEXT_H / 2)
    this.textTexture.needsUpdate = true
    this.lastText = text
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.renderer.setSize(rect.width, rect.height, false)
    this.material.uniforms.uViewportAspect.value = rect.width / rect.height
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
    this.pointer.x = (event.clientX - rect.left) / rect.width
    this.pointer.y = 1 - (event.clientY - rect.top) / rect.height
    this.pointer.moved = true
  }

  private onEnter = (event: PointerEvent) => {
    this.onMove(event)
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
  }

  private onBlur = () => {
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
    this.pointer.moved = false
  }

  private deposit() {
    const s = this.getSettings()
    const data = this.data
    const p = this.pointer
    const dx = (p.x - p.prevX) * GRID
    const dy = (p.y - p.prevY) * GRID
    const distance = Math.hypot(dx, dy)
    if (distance < 0.05) return

    const radius = Math.max(s.brushRadius * GRID, 1.5)
    const steps = Math.min(10, Math.max(1, Math.ceil(distance / (radius * 0.5))))
    const nx = dx / distance
    const ny = dy / distance

    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const cx = (p.prevX + (p.x - p.prevX) * t) * GRID
      const cy = (p.prevY + (p.y - p.prevY) * t) * GRID
      const minX = Math.max(0, Math.floor(cx - radius))
      const maxX = Math.min(GRID - 1, Math.ceil(cx + radius))
      const minY = Math.max(0, Math.floor(cy - radius))
      const maxY = Math.min(GRID - 1, Math.ceil(cy + radius))

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const ddx = x + 0.5 - cx
          const ddy = y + 0.5 - cy
          const d = Math.hypot(ddx, ddy)
          if (d > radius) continue
          const falloff = (1 - d / radius) ** 2
          const i = (y * GRID + x) * 4
          const speed = (distance / GRID) * 2.4 * falloff
          data[i] += nx * speed
          data[i + 1] += ny * speed
          data[i + 2] = Math.min(1, data[i + 2] + (distance / GRID) * 5.0 * falloff)
        }
      }
    }
  }

  private loop = (now: number) => {
    const s = this.getSettings()
    const dt = Math.min((now - this.last) / 1000, 1 / 20)
    this.last = now
    this.elapsed += dt

    if (s.text !== this.lastText) this.drawText(s.text)

    const decay = s.decay
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] *= decay
      this.data[i + 1] *= decay
      this.data[i + 2] *= decay
    }

    if (this.pointer.moved) {
      this.deposit()
      this.pointer.moved = false
    }
    this.pointer.prevX = this.pointer.x
    this.pointer.prevY = this.pointer.y
    this.texture.needsUpdate = true

    const u = this.material.uniforms
    u.uTime.value = this.elapsed
    u.uWarp.value = s.warp
    u.uIntensity.value = s.intensity
    u.uLow.value.set(...hexToRgb(s.lowColor))
    u.uHigh.value.set(...hexToRgb(s.highColor))

    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerenter', this.onEnter)
    this.canvas.removeEventListener('pointerdown', this.onMove)
    window.removeEventListener('blur', this.onBlur)
    this.texture.dispose()
    this.textTexture.dispose()
    this.material.dispose()
    this.quad.geometry.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
