import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface ImageFollowSettings {
  width: number
  height: number
  minDistance: number
  duration: number
  ease: string
}

const IMAGES = [
  'art/trail/35.jpg',
  'art/trail/36.jpg',
  'art/trail/37.jpg',
  'art/trail/38.jpg',
  'art/trail/39.jpg',
  'art/trail/40.jpg',
]

/**
 * Sequential images are appended to the DOM wherever the pointer has moved
 * far enough, then animated with GSAP. The original mouse-effects component
 * excluded a header area; here the exclusion region is the central caption.
 */
export default function ImageFollow({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const excludeRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as ImageFollowSettings)

  useEffect(() => {
    const root = rootRef.current
    const exclude = excludeRef.current
    if (!root || !exclude) return

    let lastPosition: { x: number; y: number } | null = null
    let imageIndex = 0
    let spawned = 0

    const onMove = (event: PointerEvent) => {
      const s = settingsRef.current
      const rootRect = root.getBoundingClientRect()
      const x = event.clientX - rootRect.left
      const y = event.clientY - rootRect.top

      const ex = exclude.getBoundingClientRect()
      if (
        event.clientX >= ex.left &&
        event.clientX <= ex.right &&
        event.clientY >= ex.top &&
        event.clientY <= ex.bottom
      ) {
        return
      }

      if (
        lastPosition &&
        Math.hypot(x - lastPosition.x, y - lastPosition.y) < s.minDistance
      ) {
        return
      }

      const direction = { x: 0, y: 0 }
      if (lastPosition) {
        direction.x = x - lastPosition.x > 0 ? 1 : -1
        direction.y = y - lastPosition.y > 0 ? 1 : -1
      }
      lastPosition = { x, y }

      const item = document.createElement('div')
      item.className = 'image-follow-item'
      item.style.left = `${x - s.width / 2}px`
      item.style.top = `${y - s.height / 2}px`
      item.style.width = `${s.width}px`
      item.style.height = `${s.height}px`
      const img = document.createElement('img')
      img.src = IMAGES[imageIndex % IMAGES.length]
      img.alt = ''
      img.draggable = false
      item.appendChild(img)
      root.appendChild(item)
      spawned++

      const initialX = -130 * direction.x
      const initialY = -70 * direction.y
      gsap.set(item, { scale: 0, x: initialX, y: initialY, opacity: 0 })

      gsap
        .timeline({
          onComplete: () => item.remove(),
        })
        .to(item, {
          opacity: 1,
          duration: s.duration,
          scale: 1,
          ease: s.ease,
        })
        .to(item, { x: 0, y: 0, duration: s.duration * 0.85, ease: s.ease }, '<')
        .to(
          item,
          {
            opacity: 0,
            duration: s.duration * 0.6,
            scale: 0.3,
            ease: 'power3.in',
          },
          `<+${s.duration * 0.85}`,
        )

      imageIndex++
      if (spawned > 22) {
        const oldest = root.querySelector<HTMLElement>('.image-follow-item')
        if (oldest) {
          gsap.killTweensOf(oldest)
          oldest.remove()
        }
        spawned--
      }
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerdown', onMove)
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerdown', onMove)
      root.querySelectorAll<HTMLElement>('.image-follow-item').forEach((el) => {
        gsap.killTweensOf(el)
        el.remove()
      })
    }
  }, [settingsRef])

  return (
    <div className="image-follow-root" ref={rootRef}>
      <div className="image-follow-exclude" ref={excludeRef}>
        <span>CURSOR</span>
        <strong>Image Follow</strong>
        <em>move around this card</em>
      </div>
    </div>
  )
}
