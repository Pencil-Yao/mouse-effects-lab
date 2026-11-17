export interface ClickBurstSettings {
  count: number
  size: number
  spread: number
  decay: number
  gravity: number
  palette: string
}

const PALETTES: Record<string, string[]> = {
  neon: ['#7c9cff', '#b48cff', '#5eead4', '#f4f5f7'],
  warm: ['#ffb86b', '#ff7a7a', '#ffd166', '#fff3d6'],
  ice: ['#a5f3fc', '#93c5fd', '#c7d2fe', '#ffffff'],
  confetti: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'],
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
}

/**
 * Click / tap particle burst. Same lifecycle as mouse-animations' Particles:
 * an on-demand pool, per-frame velocity + gravity integration, alpha decay.
 */
export class ClickBurstEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private getSettings: () => ClickBurstSettings
  private pool: Particle[] = []
  private raf = 0
  private observer: ResizeObserver
  private dpr = 1

  constructor(canvas: HTMLCanvasElement, getSettings: () => ClickBurstSettings) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.getSettings = getSettings
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
    canvas.addEventListener('pointerdown', this.onPointerDown)
    this.raf = requestAnimationFrame(this.loop)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private onPointerDown = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const { count, size, spread, palette } = this.getSettings()
    const colors = PALETTES[palette] ?? PALETTES.neon

    for (let i = 0; i < Math.round(count); i++) {
      const angle = (Math.PI * 2 * i) / Math.max(count, 1) + Math.random() * 0.4
      const speed = (0.35 + Math.random() * 0.75) * spread
      this.pool.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * size,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      })
    }
    if (this.pool.length > 2000) this.pool.splice(0, this.pool.length - 2000)
  }

  private loop = () => {
    const settings = this.getSettings()
    const { ctx } = this
    const w = this.canvas.width / this.dpr
    const h = this.canvas.height / this.dpr
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'

    this.pool = this.pool.filter((p) => p.alpha > 0)
    for (const p of this.pool) {
      p.x += p.vx
      p.y += p.vy
      p.vy += settings.gravity
      p.vx *= 0.985
      p.vy *= 0.985
      p.alpha -= settings.decay

      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.pool = []
  }
}
