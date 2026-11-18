export interface ConstellationSettings {
  stars: number
  maxDist: number
  cursorDist: number
  color: string
  clickGlow: boolean
}

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

/** Network of drifting stars linked to each other and to the pointer.
 *  Reconstructed from CursorX (MIT) ConstellationCursor. */
export class ConstellationEngine {
  private root: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private getSettings: () => ConstellationSettings
  private stars: Star[] = []
  private pointer = { x: -1000, y: -1000 }
  private active = false
  private clickT = -1
  private time = 0
  private raf = 0
  private observer: ResizeObserver
  private dpr = 1

  constructor(
    root: HTMLElement,
    canvas: HTMLCanvasElement,
    getSettings: () => ConstellationSettings,
  ) {
    this.root = root
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.getSettings = getSettings
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(root)
    this.resize()

    root.addEventListener('pointermove', this.onMove)
    root.addEventListener('pointerenter', this.onMove)
    root.addEventListener('pointerleave', this.onLeave)
    root.addEventListener('pointerdown', this.onClick)
    this.raf = requestAnimationFrame(this.loop)
  }

  private resize = () => {
    const rect = this.root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.rebuild(rect.width, rect.height)
  }

  private rebuild(width: number, height: number) {
    const count = Math.max(1, Math.round(this.getSettings().stars))
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 2 + 0.5,
    }))
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.root.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
    this.active = true
  }

  private onLeave = () => {
    this.active = false
    this.pointer.x = -1000
    this.pointer.y = -1000
  }

  private onClick = () => {
    if (this.getSettings().clickGlow) this.clickT = 0
  }

  private loop = () => {
    const s = this.getSettings()
    const { ctx } = this
    const width = this.canvas.width / this.dpr
    const height = this.canvas.height / this.dpr
    ctx.clearRect(0, 0, width, height)
    this.time += 0.05

    if (this.stars.length !== Math.round(s.stars)) this.rebuild(width, height)

    const targetStars = Math.max(1, Math.round(s.stars))
    if (this.stars.length > targetStars) this.stars.length = targetStars
    while (this.stars.length < targetStars) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 2 + 0.5,
      })
    }

    let clickGlow = 0
    if (this.clickT >= 0) {
      clickGlow = Math.sin(this.clickT * Math.PI)
      this.clickT += 0.05
      if (this.clickT >= 1) this.clickT = -1
    }

    for (const star of this.stars) {
      star.x += star.vx
      star.y += star.vy
      if (star.x < 0) star.x = width
      if (star.x > width) star.x = 0
      if (star.y < 0) star.y = height
      if (star.y > height) star.y = 0
    }

    for (let i = 0; i < this.stars.length; i++) {
      const a = this.stars[i]
      for (let j = i + 1; j < this.stars.length; j++) {
        const b = this.stars[j]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < s.maxDist) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(124,92,252,${(1 - d / s.maxDist) * 0.35})`
          ctx.lineWidth = 0.7
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      if (this.active) {
        const dc = Math.hypot(a.x - this.pointer.x, a.y - this.pointer.y)
        if (dc < s.cursorDist) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(92,244,252,${(1 - dc / s.cursorDist) * 0.75})`
          ctx.lineWidth = 2
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(this.pointer.x, this.pointer.y)
          ctx.stroke()

          if (clickGlow > 0) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(a.x, a.y, a.r * (1 + clickGlow * 3.7), 0, Math.PI * 2)
            ctx.fillStyle = s.color
            ctx.globalAlpha = clickGlow * 0.8
            ctx.shadowColor = '#5cf4fc'
            ctx.shadowBlur = 15 * clickGlow
            ctx.fill()
            ctx.restore()
          }
        }
      }

      ctx.beginPath()
      ctx.fillStyle = s.color
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
      ctx.fill()
    }

    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.root.removeEventListener('pointermove', this.onMove)
    this.root.removeEventListener('pointerenter', this.onMove)
    this.root.removeEventListener('pointerleave', this.onLeave)
    this.root.removeEventListener('pointerdown', this.onClick)
    this.stars = []
  }
}
