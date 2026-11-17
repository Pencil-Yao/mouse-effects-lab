export interface SpringTrailSettings {
  trails: number
  length: number
  spring: number
  friction: number
  lineWidth: number
  hue: number
  hueSpeed: number
  glow: boolean
}

interface Point {
  x: number
  y: number
}

/**
 * Multiple spring-driven curves follow one pointer.
 * Every curve integrates vx += dx * spring, vx *= friction, then x += vx,
 * which creates the characteristic overshoot and settling of the original
 * Cursor-Trial-Effect demo. The curves are drawn with quadratic mid-points
 * and the canvas 'lighter' composite mode for an additive glow.
 */
class SpringLine {
  points: Point[] = []
  x: number
  y: number
  vx = 0
  vy = 0
  spring: number
  friction: number
  hueOffset: number

  constructor(
    x: number,
    y: number,
    spring: number,
    friction: number,
    hueOffset: number,
  ) {
    this.x = x
    this.y = y
    this.spring = spring
    this.friction = friction
    this.hueOffset = hueOffset
  }

  update(targetX: number, targetY: number, maxPoints: number) {
    this.vx += (targetX - this.x) * this.spring
    this.vy += (targetY - this.y) * this.spring
    this.vx *= this.friction
    this.vy *= this.friction
    this.x += this.vx
    this.y += this.vy
    this.points.push({ x: this.x, y: this.y })
    if (this.points.length > maxPoints) this.points.shift()
  }

  reset(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.points = []
  }

  draw(ctx: CanvasRenderingContext2D, hue: number, lineWidth: number, glow: boolean) {
    const n = this.points.length
    if (n < 2) return
    ctx.strokeStyle = `hsla(${(hue + this.hueOffset) % 360}, 86%, 62%, 0.72)`
    ctx.lineWidth = lineWidth
    ctx.shadowBlur = glow ? 14 : 0
    ctx.shadowColor = `hsla(${(hue + this.hueOffset) % 360}, 96%, 66%, 0.75)`
    ctx.beginPath()
    ctx.moveTo(this.points[0].x, this.points[0].y)
    for (let i = 1; i < n - 2; i++) {
      const xc = (this.points[i].x + this.points[i + 1].x) / 2
      const yc = (this.points[i].y + this.points[i + 1].y) / 2
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc)
    }
    const last = this.points[n - 1]
    const prev = this.points[n - 2]
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y)
    ctx.stroke()
  }
}

export class SpringTrailEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private getSettings: () => SpringTrailSettings
  private lines: SpringLine[] = []
  private pointer = { x: 0, y: 0 }
  private last = performance.now()
  private hue = 220
  private lastHue = Number.NaN
  private raf = 0
  private resizeObserver: ResizeObserver
  private dpr = 1

  constructor(canvas: HTMLCanvasElement, getSettings: () => SpringTrailSettings) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })!
    this.getSettings = getSettings
    this.hue = getSettings().hue

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()

    const rect = canvas.getBoundingClientRect()
    this.pointer = { x: rect.width / 2, y: rect.height / 2 }

    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerdown', this.onPointerMove)
    canvas.addEventListener('pointerenter', this.onPointerMove)
    this.raf = requestAnimationFrame(this.loop)
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private syncLineCount(count: number) {
    while (this.lines.length < count) {
      const i = this.lines.length
      this.lines.push(
        new SpringLine(
          this.pointer.x,
          this.pointer.y,
          0.4 + Math.random() * 0.08,
          0.62 + Math.random() * 0.12,
          i * 4,
        ),
      )
    }
    if (this.lines.length > count) this.lines.length = count
  }

  private loop = (now: number) => {
    const settings = this.getSettings()
    const dt = Math.min((now - this.last) / 1000, 1 / 20)
    this.last = now

    this.syncLineCount(Math.round(settings.trails))
    if (settings.hue !== this.lastHue) {
      this.hue = settings.hue
      this.lastHue = settings.hue
    }
    this.hue += settings.hueSpeed * 60 * dt

    const w = this.canvas.width / this.dpr
    const h = this.canvas.height / this.dpr
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.globalCompositeOperation = 'lighter'

    for (const line of this.lines) {
      line.spring = settings.spring + Math.random() * 0.02
      line.friction = settings.friction
      line.update(this.pointer.x, this.pointer.y, Math.round(settings.length))
      line.draw(this.ctx, this.hue, settings.lineWidth, settings.glow)
    }
    this.ctx.shadowBlur = 0
    this.ctx.globalCompositeOperation = 'source-over'
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerMove)
    this.canvas.removeEventListener('pointerenter', this.onPointerMove)
    this.lines = []
  }
}
