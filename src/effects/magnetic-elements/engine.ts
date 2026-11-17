export interface MagneticSettings {
  strength: number
  radius: number
  ease: number
}

interface Entry {
  el: HTMLElement
  baseX: number
  baseY: number
  targetX: number
  targetY: number
  x: number
  y: number
}

/**
 * Pulls each tile toward the pointer when it is inside the activation
 * radius, then lets a per-frame lerp settle it back on leave.
 * Based on mouse-animations' Magnetic + ElementAnimator.
 */
export class MagneticEngine {
  private root: HTMLElement
  private getSettings: () => MagneticSettings
  private entries: Entry[] = []
  private pointer = { x: 0, y: 0 }
  private active = false
  private raf = 0

  constructor(root: HTMLElement, getSettings: () => MagneticSettings) {
    this.root = root
    this.getSettings = getSettings
    this.measure()
    root.addEventListener('pointermove', this.onMove)
    root.addEventListener('pointerenter', this.onMove)
    root.addEventListener('pointerleave', this.onLeave)
    this.raf = requestAnimationFrame(this.loop)
  }

  private measure() {
    this.entries = Array.from(this.root.querySelectorAll<HTMLElement>('.magnetic-item')).map(
      (el) => ({
        el,
        baseX: el.offsetLeft + el.offsetWidth / 2,
        baseY: el.offsetTop + el.offsetHeight / 2,
        targetX: 0,
        targetY: 0,
        x: 0,
        y: 0,
      }),
    )
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.root.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
    this.active = true
  }

  private onLeave = () => {
    this.active = false
    this.entries.forEach((entry) => {
      entry.targetX = 0
      entry.targetY = 0
    })
  }

  private loop = () => {
    const s = this.getSettings()
    for (const entry of this.entries) {
      if (this.active) {
        const dx = this.pointer.x - entry.baseX
        const dy = this.pointer.y - entry.baseY
        const distance = Math.hypot(dx, dy)
        if (distance < s.radius) {
          entry.targetX = dx * s.strength
          entry.targetY = dy * s.strength
        } else {
          entry.targetX = 0
          entry.targetY = 0
        }
      }
      entry.x += (entry.targetX - entry.x) * s.ease
      entry.y += (entry.targetY - entry.y) * s.ease
      entry.el.style.transform = `translate3d(${entry.x.toFixed(2)}px, ${entry.y.toFixed(2)}px, 0)`
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.root.removeEventListener('pointermove', this.onMove)
    this.root.removeEventListener('pointerenter', this.onMove)
    this.root.removeEventListener('pointerleave', this.onLeave)
    this.entries.forEach((entry) => {
      entry.el.style.transform = ''
    })
    this.entries = []
  }
}
