import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface GellySettings {
  size: number
  color: string
  jelly: number
  smoothness: number
  stick: number
  blend: string
}

/**
 * Smooth follower + velocity-driven jelly deformation + sticky target.
 * Core maths reconstructed from react-creative-cursor (MIT):
 * angle = atan2(vy, vx), scale = min(distance / 735, 0.35),
 * scaleX = 1 + scale, scaleY = 1 - scale, inner counter-rotates.
 */
export default function GellyCursor({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as GellySettings)

  useEffect(() => {
    const root = rootRef.current
    const cursor = cursorRef.current
    const inner = innerRef.current
    if (!root || !cursor || !inner) return

    let pointer = { x: 0, y: 0 }
    let pos = { x: 0, y: 0 }
    let hasPointer = false
    let stickyEl: HTMLElement | null = null
    let textEl: HTMLElement | null = null
    let invertZone = false
    let currentSize = settingsRef.current.size
    let raf = 0
    let last = performance.now()

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      if (!hasPointer) {
        pos = { ...pointer }
        hasPointer = true
        cursor.classList.add('is-visible')
      }
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-gelly]')
      stickyEl = target?.dataset.gelly === 'sticky' ? target : null
      textEl = target?.dataset.gelly === 'text' ? target : null
      invertZone = target?.dataset.gelly === 'invert'
      cursor.classList.toggle('is-hover', Boolean(textEl))
      inner.textContent = textEl?.dataset.text ?? ''
      cursor.dataset.mode = target?.dataset.gelly ?? ''
    }

    const onLeave = () => {
      hasPointer = false
      cursor.classList.remove('is-visible', 'is-hover')
      stickyEl = null
      textEl = null
      invertZone = false
    }

    const loop = (now: number) => {
      const s = settingsRef.current
      const dt = Math.min((now - last) / 16.667, 3)
      last = now

      let targetX = pointer.x
      let targetY = pointer.y
      if (stickyEl) {
        const rootRect = root.getBoundingClientRect()
        const r = stickyEl.getBoundingClientRect()
        const cx = r.left - rootRect.left + r.width / 2
        const cy = r.top - rootRect.top + r.height / 2
        targetX = cx + (pointer.x - cx) * s.stick
        targetY = cy + (pointer.y - cy) * s.stick
      }

      const follow = 1 - Math.pow(1 - s.smoothness, dt)
      pos.x += (targetX - pos.x) * follow
      pos.y += (targetY - pos.y) * follow

      const vx = targetX - pos.x
      const vy = targetY - pos.y
      const distance = Math.hypot(vx, vy)
      const angle = (Math.atan2(vy, vx) * 180) / Math.PI
      const scale = Math.min(distance / 735, 0.35)

      const desiredSize = textEl?.dataset.size ? Number(textEl.dataset.size) : s.size
      currentSize += (desiredSize - currentSize) * Math.min(0.2 * dt, 1)
      cursor.style.width = `${currentSize + scale * s.jelly * 0.35}px`
      cursor.style.height = `${currentSize}px`
      cursor.style.background = s.color
      cursor.style.mixBlendMode = invertZone ? 'exclusion' : s.blend
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scaleX(${1 + scale}) scaleY(${1 - scale})`
      inner.style.transform = `rotate(${-angle}deg) scale(${textEl ? 1 : 0})`

      raf = requestAnimationFrame(loop)
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onMove)
    root.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [settingsRef])

  return (
    <div className="gelly-root" ref={rootRef}>
      <div className="gelly-copy">
        <span>CURSOR</span>
        <h4>Gelly / Sticky</h4>
        <p>Move across the card, hover the target, then the exclusion strip.</p>
      </div>
      <div className="gelly-sticky" data-gelly="sticky">
        <span className="gelly-sticky-dot" />
        sticky target
      </div>
      <div className="gelly-text-target" data-gelly="text" data-size="88" data-text="VIEW">
        hover me
      </div>
      <div className="gelly-invert" data-gelly="invert">
        <span>blend zone</span>
      </div>
      <div className="gelly-cursor" ref={cursorRef}>
        <div className="gelly-cursor-inner" ref={innerRef} />
      </div>
    </div>
  )
}
