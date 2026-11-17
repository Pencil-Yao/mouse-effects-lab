import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface ImageTrailSettings {
  threshold: number
  lag: number
  imageSize: number
  variant: 'classic' | 'pop' | 'speed'
}

const IMAGES = [
  'art/trail/31.jpg',
  'art/trail/32.jpg',
  'art/trail/33.jpg',
  'art/trail/34.jpg',
  'art/trail/35.jpg',
  'art/trail/36.jpg',
  'art/trail/37.jpg',
  'art/trail/38.jpg',
  'art/trail/39.jpg',
  'art/trail/40.jpg',
]

const POOL = 16

function map(value: number, outMin: number, outMax: number, max: number) {
  return outMin + (outMax - outMin) * Math.min(value / max, 1)
}

/**
 * Image trail driven by a pointer-distance threshold.
 * The pointer and a lagging position define a "lead" vector; every time the
 * pointer has travelled `threshold` px a pool image is positioned along the
 * line and animated with GSAP. Reconstructed from Codrops
 * MotionTrailAnimations (MIT), trail.js + demo 1/2/6.
 */
export default function ImageTrail({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])
  const settingsRef = useLatest(settings as unknown as ImageTrailSettings)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = itemsRef.current.filter(Boolean)
    gsap.set(items, { xPercent: -50, yPercent: -50, opacity: 0 })

    let pointer: { x: number; y: number } | null = null
    let trailing = { x: 0, y: 0 }
    let last = { x: 0, y: 0 }
    let previous = { x: 0, y: 0 }
    let count = 0
    let zIndex = 1

    const reset = (x: number, y: number) => {
      pointer = { x, y }
      trailing = { x, y }
      last = { x, y }
      previous = { x, y }
    }

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (!pointer) reset(x, y)
      else pointer = { x, y }
    }

    const onLeave = () => {
      pointer = null
    }

    const onDown = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      reset(e.clientX - rect.left, e.clientY - rect.top)
    }

    const show = (to: { x: number; y: number }, lead: { x: number; y: number }) => {
      const img = items[count % items.length]
      count++
      const el = img
      const inner = el.firstElementChild as HTMLElement
      const s = settingsRef.current
      const from = { x: to.x - lead.x, y: to.y - lead.y }
      gsap.killTweensOf([el, inner])
      const speed = Math.hypot(lead.x, lead.y)

      if (s.variant === 'pop') {
        gsap
          .timeline()
          .fromTo(
            el,
            { opacity: 1, scale: 0, zIndex: zIndex++, x: from.x, y: from.y },
            { duration: 0.4, ease: 'power1', scale: 1, x: to.x, y: to.y },
          )
          .fromTo(
            inner,
            { scale: 2.8, filter: 'brightness(250%)' },
            { duration: 0.4, ease: 'power1', scale: 1, filter: 'brightness(100%)' },
            0,
          )
          .to(el, { duration: 0.4, ease: 'power2', opacity: 0, scale: 0.2 }, 0.45)
        return
      }

      if (s.variant === 'speed') {
        const scale = map(speed, 0.3, 2, 200)
        const brightness = map(speed, 0, 1.3, 70)
        const blur = map(speed, 20, 0, 90)
        const grayscale = map(speed, 600, 0, 90)
        gsap
          .timeline()
          .fromTo(
            el,
            { opacity: 1, scale: 0, zIndex: zIndex++, x: from.x, y: from.y },
            {
              duration: 0.8,
              ease: 'power3',
              scale,
              x: to.x,
              y: to.y,
              filter: `grayscale(${grayscale * 100}%) brightness(${brightness * 100}%) blur(${blur}px)`,
            },
          )
          .fromTo(inner, { scale: 2 }, { duration: 0.8, ease: 'power3', scale: 1 }, 0)
          .to(el, { duration: 0.4, ease: 'power3.in', opacity: 0, scale: 0.2 }, 0.45)
        return
      }

      gsap
        .timeline()
        .fromTo(
          el,
          { opacity: 1, scale: 1, zIndex: zIndex++, x: from.x, y: from.y },
          { duration: 0.4, ease: 'power1', x: to.x, y: to.y },
        )
        .to(el, { duration: 0.4, ease: 'power3', opacity: 0, scale: 0.2 }, 0.4)
    }

    const tick = () => {
      const s = settingsRef.current
      const dt = gsap.ticker.deltaRatio(60)
      if (!pointer) return

      const lead = { x: pointer.x - trailing.x, y: pointer.y - trailing.y }
      previous = { ...pointer }
      const follow = 1 - Math.pow(1 - s.lag, dt)
      trailing.x += (pointer.x - trailing.x) * follow
      trailing.y += (pointer.y - trailing.y) * follow

      const dx = pointer.x - last.x
      const dy = pointer.y - last.y
      let distance = Math.hypot(dx, dy)
      if (distance < s.threshold) return

      const step = { x: (dx / distance) * s.threshold, y: (dy / distance) * s.threshold }
      let n = 0
      while (distance >= s.threshold && n < 4) {
        last = { x: last.x + step.x, y: last.y + step.y }
        distance -= s.threshold
        show(last, lead)
        n++
      }
      if (distance >= s.threshold) last = { ...pointer }
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerdown', onDown)
    root.addEventListener('pointerenter', onMove)
    root.addEventListener('pointerleave', onLeave)
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointerenter', onMove)
      root.removeEventListener('pointerleave', onLeave)
      items.forEach((el) => gsap.killTweensOf([el, el.firstElementChild]))
      gsap.set(items, { clearProps: 'all' })
    }
  }, [settingsRef])

  useEffect(() => {
    rootRef.current?.style.setProperty('--trail-size', `${settings.imageSize}px`)
  }, [settings.imageSize])

  return (
    <div className="image-trail-root" ref={rootRef}>
      <div className="image-trail-bg" aria-hidden="true">
        motion
        <br />
        trail
      </div>
      {Array.from({ length: POOL }, (_, i) => (
        <div
          className="image-trail-item"
          key={i}
          ref={(node) => {
            if (node) itemsRef.current[i] = node
          }}
        >
          <div
            className="image-trail-inner"
            style={{ backgroundImage: `url(${IMAGES[i % IMAGES.length]})` }}
          />
        </div>
      ))}
    </div>
  )
}
