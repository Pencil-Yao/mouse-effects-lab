export interface DotTrailSettings {
  color: string
  size: number
  length: number
  decay: number
  blur: number
}

interface TrailPoint {
  x: number
  y: number
  alpha: number
}

/**
 * Canvas-overlay dot trail: every pointermove pushes a point with its own
 * alpha, older points are smaller and dimmer, and alpha decays each frame.
 * Direct reconstruction of the Trail class in `mouse-animations`.
 */
export class DotTrailEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private getSettings: () => DotTrailSettings
  private points: TrailPoint[] = []
  private raf = 0
  private observer: ResizeObserver
  private dpr = 1

  constructor(canvas: HTMLCanvasElement, getSettings: () => DotTrailSettings) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.getSettings = getSettings
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerdown', this.onMove)
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

  private onMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, alpha: 1 })
    const length = Math.round(this.getSettings().length)
    while (this.points.length > length) this.points.shift()
  }

  private loop = () => {
    const settings = this.getSettings()
    const { ctx } = this
    const w = this.canvas.width / this.dpr
    const h = this.canvas.height / this.dpr
    ctx.clearRect(0, 0, w, h)

    const count = this.points.length
    if (settings.blur > 0) ctx.filter = `blur(${settings.blur}px)`
    for (let i = 0; i < count; i++) {
      const point = this.points[i]
      const ratio = (i + 1) / count
      ctx.globalAlpha = point.alpha * ratio
      ctx.fillStyle = settings.color
      ctx.beginPath()
      ctx.arc(point.x, point.y, Math.max(settings.size * ratio, 0.5), 0, Math.PI * 2)
      ctx.fill()
      point.alpha = Math.max(0, point.alpha - settings.decay)
    }
    ctx.globalAlpha = 1
    if (settings.blur > 0) ctx.filter = 'none'

    this.points = this.points.filter((point) => point.alpha > 0)
    while (this.points.length > Math.round(settings.length)) this.points.shift()
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerdown', this.onMove)
    this.points = []
  }
}
