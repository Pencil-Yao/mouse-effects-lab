export interface FireTrailSettings {
  count: number
  rise: number
  size: number
  clickBurst: number
  glow: number
}

function createGlowSprite() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 246, 200, 0.95)')
  gradient.addColorStop(0.28, 'rgba(255, 196, 92, 0.55)')
  gradient.addColorStop(0.68, 'rgba(255, 92, 24, 0.16)')
  gradient.addColorStop(1, 'rgba(255, 60, 0, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(32, 32, 32, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

class Flame {
  x: number
  y: number
  vx: number
  vy: number
  life = 1
  decay: number
  size: number
  ember: boolean

  constructor(x: number, y: number, rise: number, size: number, ember = false) {
    this.x = x + (Math.random() - 0.5) * 8
    this.y = y
    this.vx = (Math.random() - 0.5) * 1.8
    this.vy = -(Math.random() * rise + 1.2)
    this.decay = Math.random() * 0.028 + 0.016
    this.size = Math.random() * size + 3
    this.ember = ember
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    if (this.ember) {
      this.vy += 0.06
    } else {
      this.vx += (Math.random() - 0.5) * 0.35
    }
    this.life -= this.decay
    this.size *= 0.968
  }

  draw(ctx: CanvasRenderingContext2D, glow: number, sprite: HTMLCanvasElement) {
    const hue =
      this.life > 0.55 ? 42 + (1 - this.life) * 22 : this.life > 0.2 ? 12 : 0
    const sat = this.life > 0.2 ? 100 : Math.max(0, (this.life / 0.2) * 40)
    const light = this.life > 0.2 ? 52 + this.life * 18 : 35
    if (glow > 0) {
      const halo = Math.max(6, this.size * (2.2 + glow * 0.12))
      ctx.globalAlpha = Math.max(0, this.life * 0.5)
      ctx.drawImage(sprite, this.x - halo, this.y - halo, halo * 2, halo * 2)
    }
    ctx.globalAlpha = Math.max(0, this.life * 0.92)
    ctx.fillStyle = `hsl(${hue},${sat}%,${light}%)`
    ctx.beginPath()
    ctx.arc(this.x, this.y, Math.max(0.1, this.size * 0.62), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

/**
 * Canvas ember trail. The pointer emits rising flames; clicking adds a radial
 * shard-like ember burst. Reconstructed from CursorX (MIT) FireTrailCursor.
 */
export class FireTrailEngine {
  private root: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private getSettings: () => FireTrailSettings
  private particles: Flame[] = []
  private sprite: HTMLCanvasElement
  private pointer = { x: 0, y: 0 }
  private active = false
  private raf = 0
  private observer: ResizeObserver
  private dpr = 1

  constructor(root: HTMLElement, canvas: HTMLCanvasElement, getSettings: () => FireTrailSettings) {
    this.root = root
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.getSettings = getSettings
    this.sprite = createGlowSprite()
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(root)
    this.resize()

    root.addEventListener('pointermove', this.onMove)
    root.addEventListener('pointerenter', this.onMove)
    root.addEventListener('pointerleave', this.onLeave)
    root.addEventListener('pointerdown', this.onDown)
    this.raf = requestAnimationFrame(this.loop)
  }

  private resize = () => {
    const rect = this.root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.root.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
    this.active = true
  }

  private onLeave = () => {
    this.active = false
  }

  private onDown = () => {
    const s = this.getSettings()
    const total = Math.round(s.clickBurst)
    for (let i = 0; i < total; i++) {
      const ember = new Flame(this.pointer.x, this.pointer.y, s.rise, s.size, true)
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4.5 + 2
      ember.vx = Math.cos(angle) * speed
      ember.vy = Math.sin(angle) * speed - 1
      ember.decay = Math.random() * 0.035 + 0.015
      ember.size = Math.random() * 5 + 3
      this.particles.push(ember)
    }
    if (this.particles.length > 2200) {
      this.particles.splice(0, this.particles.length - 2200)
    }
  }

  private loop = () => {
    const s = this.getSettings()
    const { ctx } = this
    const w = this.canvas.width / this.dpr
    const h = this.canvas.height / this.dpr
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'

    if (this.active) {
      const total = Math.round(s.count)
      for (let i = 0; i < total; i++) {
        this.particles.push(new Flame(this.pointer.x, this.pointer.y, s.rise, s.size))
      }
    }

    this.particles = this.particles.filter((p) => p.life > 0)
    for (const p of this.particles) {
      p.update()
      p.draw(ctx, s.glow, this.sprite)
    }
    ctx.globalCompositeOperation = 'source-over'
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.root.removeEventListener('pointermove', this.onMove)
    this.root.removeEventListener('pointerenter', this.onMove)
    this.root.removeEventListener('pointerleave', this.onLeave)
    this.root.removeEventListener('pointerdown', this.onDown)
    this.particles = []
  }
}
