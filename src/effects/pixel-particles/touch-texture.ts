import * as THREE from 'three'

function easeOutSine(t: number) {
  return Math.sin((t * Math.PI) / 2)
}

/**
 * A 64×64 offscreen canvas becomes the pointer "ray texture" read by the
 * vertex shader. Each pointer sample draws a radial gradient; samples age
 * and are recycled, leaving a soft travelling ripple behind the cursor.
 */
export class TouchTexture {
  readonly texture: THREE.Texture
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private size = 64
  private maxAge = 70
  private radius = 0.26
  private trail: { x: number; y: number; age: number; force: number }[] = []

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.size
    this.canvas.height = this.size
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.size, this.size)
    this.texture = new THREE.Texture(this.canvas)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.needsUpdate = true
  }

  addTouch(x: number, y: number) {
    let force = 0.5
    const last = this.trail[this.trail.length - 1]
    if (last) {
      const dx = last.x - x
      const dy = last.y - y
      force = Math.min((dx * dx + dy * dy) * 18000, 1)
    }
    this.trail.push({ x, y, age: 0, force })
  }

  update() {
    const { ctx, size } = this
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, size, size)

    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i]
      point.age++
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1)
        continue
      }
      this.drawTouch(point)
    }
    this.texture.needsUpdate = true
  }

  private drawTouch(point: { x: number; y: number; age: number; force: number }) {
    const px = point.x * this.size
    const py = (1 - point.y) * this.size
    let intensity: number
    if (point.age < this.maxAge * 0.3) {
      intensity = easeOutSine(point.age / (this.maxAge * 0.3))
    } else {
      intensity = easeOutSine(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7))
    }
    intensity *= point.force

    const radius = this.size * this.radius * intensity
    if (radius < 0.2) return
    const grd = this.ctx.createRadialGradient(px, py, radius * 0.25, px, py, radius)
    grd.addColorStop(0, 'rgba(255,255,255,1.0)')
    grd.addColorStop(0.45, 'rgba(255,255,255,0.55)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    this.ctx.beginPath()
    this.ctx.fillStyle = grd
    this.ctx.arc(px, py, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  destroy() {
    this.trail = []
    this.texture.dispose()
  }
}
