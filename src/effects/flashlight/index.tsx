import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface FlashlightSettings {
  size: number
  blur: number
  smoothness: number
  backdrop: string
}

/**
 * A full-bleed dark overlay is masked with a transparent radial hole.
 * A rAF lerp moves the hole toward the pointer, giving the light a little
 * weight. Reconstructed from mouse-animations' Flashlight.
 */
export default function Flashlight({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as FlashlightSettings)

  useEffect(() => {
    const root = rootRef.current
    const overlay = overlayRef.current
    if (!root || !overlay) return

    let raw = { x: 0, y: 0 }
    let smooth = { x: 0, y: 0 }
    let raf = 0
    let last = performance.now()
    let initialized = false

    const rect = root.getBoundingClientRect()
    raw = { x: rect.width / 2, y: rect.height / 2 }
    smooth = { ...raw }

    const onMove = (event: PointerEvent) => {
      const r = root.getBoundingClientRect()
      raw.x = event.clientX - r.left
      raw.y = event.clientY - r.top
      if (!initialized) {
        smooth = { ...raw }
        initialized = true
      }
    }

    const loop = (now: number) => {
      const s = settingsRef.current
      const dt = Math.min((now - last) / 16.667, 3)
      last = now
      const follow = 1 - Math.pow(1 - s.smoothness, dt)
      smooth.x += (raw.x - smooth.x) * follow
      smooth.y += (raw.y - smooth.y) * follow

      overlay.style.setProperty('--fl-x', `${smooth.x}px`)
      overlay.style.setProperty('--fl-y', `${smooth.y}px`)
      overlay.style.setProperty('--fl-r', `${s.size}px`)
      overlay.style.background = s.backdrop
      overlay.style.backdropFilter = s.blur > 0 ? `blur(${s.blur}px)` : 'none'
      overlay.style.setProperty('-webkit-backdrop-filter', s.blur > 0 ? `blur(${s.blur}px)` : 'none')
      raf = requestAnimationFrame(loop)
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onMove)
    }
  }, [settingsRef])

  return (
    <div className="flashlight-root" ref={rootRef}>
      <div className="flashlight-scene">
        <img src="art/trail/34.jpg" alt="" draggable={false} />
        <div className="flashlight-copy">
          <span>hidden surface</span>
          <h4>Look closer.</h4>
          <p>The circle is a CSS mask; the dark layer is the light switch.</p>
        </div>
      </div>
      <div className="flashlight-overlay" ref={overlayRef} />
    </div>
  )
}
