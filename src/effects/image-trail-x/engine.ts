import gsap from 'gsap'

export type ImageTrailXVariant =
  | 'smooth'
  | 'flash'
  | 'rise'
  | 'speed'
  | 'spin'
  | 'blur'
  | 'stack'
  | 'perspective'

export interface ImageTrailXSettings {
  variant: ImageTrailXVariant
  threshold: number
  lag: number
  imageSize: number
  duration: number
  brightness: number
}

interface Point {
  x: number
  y: number
}

/**
 * Eight image-trail behaviours extracted from the MIT `image-trail` project:
 * smooth scale, flash, explosive rise, speed inertia, spin, motion blur,
 * persistent stack and 3D perspective.
 *
 * The pointer path is sampled by distance; a lerped "cache" point provides
 * the trailing origin for each image. Every variant is a GSAP timeline.
 */
export class ImageTrailXEngine {
  private root: HTMLElement
  private items: HTMLElement[]
  private getSettings: () => ImageTrailXSettings
  private pointer: Point | null = null
  private cache: Point = { x: 0, y: 0 }
  private last: Point = { x: 0, y: 0 }
  private previous: Point = { x: 0, y: 0 }
  private count = 0
  private zIndex = 1

  constructor(
    root: HTMLElement,
    items: HTMLElement[],
    getSettings: () => ImageTrailXSettings,
  ) {
    this.root = root
    this.items = items
    this.getSettings = getSettings

    gsap.set(this.items, {
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      transformPerspective: 1000,
      transformOrigin: '50% 50%',
    })

    root.addEventListener('pointermove', this.onMove)
    root.addEventListener('pointerenter', this.onEnter)
    root.addEventListener('pointerdown', this.onDown)
    root.addEventListener('pointerleave', this.onLeave)
    gsap.ticker.add(this.tick)
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.root.getBoundingClientRect()
    this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private onEnter = (event: PointerEvent) => {
    this.onDown(event)
  }

  private onDown = (event: PointerEvent) => {
    const rect = this.root.getBoundingClientRect()
    this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    this.cache = { ...this.pointer }
    this.last = { ...this.pointer }
    this.previous = { ...this.pointer }
  }

  private onLeave = () => {
    this.pointer = null
  }

  private tick = () => {
    if (!this.pointer) return
    const s = this.getSettings()
    const dt = gsap.ticker.deltaRatio(60)

    this.previous = { ...this.pointer }
    const follow = 1 - Math.pow(1 - s.lag, dt)
    this.cache.x += (this.pointer.x - this.cache.x) * follow
    this.cache.y += (this.pointer.y - this.cache.y) * follow

    const distance = Math.hypot(
      this.pointer.x - this.last.x,
      this.pointer.y - this.last.y,
    )
    if (distance < s.threshold) return

    this.last = { ...this.pointer }
    this.show(this.pointer.x, this.pointer.y)
  }

  private show(x: number, y: number) {
    const s = this.getSettings()
    const item = this.items[this.count % this.items.length]
    this.count++
    const inner = item.firstElementChild as HTMLElement
    const fromX = this.cache.x
    const fromY = this.cache.y
    const leadX = x - this.cache.x
    const leadY = y - this.cache.y
    const speed = Math.hypot(leadX, leadY)
    const angle = (Math.atan2(leadY, leadX) * 180) / Math.PI
    const rect = this.root.getBoundingClientRect()
    const nx = (x / Math.max(rect.width, 1) - 0.5) * 2
    const ny = (y / Math.max(rect.height, 1) - 0.5) * 2
    const base = Math.max(s.duration, 0.2)
    const z = this.zIndex++

    gsap.killTweensOf([item, inner])

    const baseSet = {
      opacity: 1,
      zIndex: z,
      x: fromX,
      y: fromY,
      rotation: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      filter: 'none',
    }

    if (s.variant === 'flash') {
      gsap
        .timeline()
        .fromTo(
          item,
          { ...baseSet, scale: 0 },
          { duration: 0.4 * base, ease: 'power1', scale: 1, x, y },
        )
        .fromTo(
          inner,
          { scale: 2.8, filter: `brightness(${250 * s.brightness}%)` },
          {
            duration: 0.4 * base,
            ease: 'power1',
            scale: 1,
            filter: `brightness(${100 * s.brightness}%)`,
          },
          0,
        )
        .to(item, { duration: 0.4 * base, ease: 'power2', opacity: 0, scale: 0.2 }, 0.45 * base)
      return
    }

    if (s.variant === 'rise') {
      gsap
        .timeline()
        .fromTo(
          item,
          { ...baseSet, scale: 0 },
          { duration: 0.4 * base, ease: 'power1', scale: 1, x, y },
        )
        .to(
          item,
          {
            duration: 0.6 * base,
            ease: 'power3.in',
            opacity: 0,
            scale: 0.2,
            xPercent: -50 + gsap.utils.random(-30, 30),
            y: y - 200,
          },
          0.35 * base,
        )
      return
    }

    if (s.variant === 'speed') {
      const drive = Math.min(speed, 80)
      const boost = (100 + drive * 0.7) * s.brightness
      const contrast = 100 + drive * 0.35
      gsap
        .timeline()
        .fromTo(
          item,
          { ...baseSet, scale: 0 },
          {
            duration: 0.4 * base,
            ease: 'power1',
            scale: 1,
            x,
            y,
            filter: `brightness(${boost}%) contrast(${contrast}%)`,
          },
        )
        .to(
          item,
          {
            duration: 0.4 * base,
            ease: 'power2',
            opacity: 0,
            scale: 0.2,
            filter: `brightness(${100 * s.brightness}%) contrast(100%)`,
          },
          0.4 * base,
        )
      return
    }

    if (s.variant === 'spin') {
      gsap
        .timeline()
        .fromTo(
          item,
          {
            ...baseSet,
            scale: 0.1,
            rotation: angle,
            filter: 'brightness(80%)',
          },
          {
            duration: 1 * base,
            ease: 'power2.out',
            scale: 1,
            rotation: angle + gsap.utils.random(-20, 20),
            x,
            y,
            filter: 'brightness(100%)',
          },
        )
        .to(
          item,
          {
            duration: 0.6 * base,
            ease: 'power2.in',
            opacity: 0,
            scale: 0.15,
            rotation: angle + gsap.utils.random(-50, 50),
          },
          0.7 * base,
        )
      return
    }

    if (s.variant === 'blur') {
      const scale = Math.min(0.3 + speed / 90, 2)
      const brightness = Math.min(1.3, speed / 70)
      const blur = Math.max(0, 20 - speed / 4)
      const grayscale = Math.max(0, 600 - speed * 6)
      gsap
        .timeline()
        .fromTo(
          item,
          { ...baseSet, scale: 0 },
          {
            duration: 0.8 * base,
            ease: 'power3',
            scale,
            x,
            y,
            filter: `grayscale(${grayscale}%) brightness(${brightness * 100}%) blur(${blur}px)`,
          },
        )
        .fromTo(inner, { scale: 2 }, { duration: 0.8 * base, ease: 'power3', scale: 1 }, 0)
        .to(item, { duration: 0.4 * base, ease: 'power3.in', opacity: 0, scale: 0.2 }, 0.45 * base)
      return
    }

    if (s.variant === 'stack') {
      gsap
        .timeline()
        .fromTo(
          item,
          { ...baseSet, scale: 0.85 },
          { duration: 0.35 * base, ease: 'power2.out', scale: 1, x, y },
        )
        .to(
          item,
          {
            duration: 1.6 * base,
            ease: 'power1.out',
            opacity: 0,
            y: y - 90,
            scale: 1.08,
          },
          0.35 * base,
        )
      return
    }

    if (s.variant === 'perspective') {
      const rotX = -ny * 26
      const rotY = nx * 26
      gsap
        .timeline()
        .fromTo(
          item,
          {
            ...baseSet,
            scale: 0.5,
            rotationX: -ny * 10,
            rotationY: nx * 10,
            filter: 'brightness(70%)',
          },
          {
            duration: 0.8 * base,
            ease: 'power3.out',
            scale: 1,
            rotationX: rotX,
            rotationY: rotY,
            x,
            y,
            filter: 'brightness(100%)',
          },
        )
        .to(
          item,
          {
            duration: 0.6 * base,
            ease: 'power2.in',
            opacity: 0,
            scale: 0.35,
            y: y - 30,
          },
          0.75 * base,
        )
      return
    }

    gsap
      .timeline()
      .fromTo(
        item,
        baseSet,
        { duration: 0.4 * base, ease: 'power1', x, y },
      )
      .to(item, { duration: 0.4 * base, ease: 'power3', opacity: 0, scale: 0.2 }, 0.4 * base)
  }

  destroy() {
    gsap.ticker.remove(this.tick)
    this.root.removeEventListener('pointermove', this.onMove)
    this.root.removeEventListener('pointerenter', this.onEnter)
    this.root.removeEventListener('pointerdown', this.onDown)
    this.root.removeEventListener('pointerleave', this.onLeave)
    this.items.forEach((item) => {
      gsap.killTweensOf([item, item.firstElementChild])
      gsap.set(item, { clearProps: 'all' })
    })
    this.items = []
  }
}
