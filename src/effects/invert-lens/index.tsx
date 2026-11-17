import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface InvertSettings {
  size: number
  color: string
  smoothness: number
  blend: string
}

/**
 * A circle on top of the content uses mix-blend-mode: difference, so it
 * inverts whatever is underneath it. Based on mouse-animations' Invert.
 */
export default function InvertLens({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as InvertSettings)

  useEffect(() => {
    const root = rootRef.current
    const lens = lensRef.current
    if (!root || !lens) return

    const rect = root.getBoundingClientRect()
    let raw = { x: rect.width / 2, y: rect.height / 2 }
    let smooth = { ...raw }
    let raf = 0
    let last = performance.now()

    const onMove = (event: PointerEvent) => {
      const r = root.getBoundingClientRect()
      raw.x = event.clientX - r.left
      raw.y = event.clientY - r.top
      lens.classList.add('is-visible')
    }
    const onLeave = () => lens.classList.remove('is-visible')

    const loop = (now: number) => {
      const s = settingsRef.current
      const dt = Math.min((now - last) / 16.667, 3)
      last = now
      const follow = 1 - Math.pow(1 - s.smoothness, dt)
      smooth.x += (raw.x - smooth.x) * follow
      smooth.y += (raw.y - smooth.y) * follow
      lens.style.width = `${s.size}px`
      lens.style.height = `${s.size}px`
      lens.style.background = s.color
      lens.style.mixBlendMode = s.blend
      lens.style.transform = `translate3d(${smooth.x}px, ${smooth.y}px, 0) translate(-50%, -50%)`
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
    <div className="invert-root" ref={rootRef}>
      <div className="invert-stripes" aria-hidden="true" />
      <div className="invert-content">
        <span>MIX BLEND MODE</span>
        <h4>INVERT</h4>
        <p>difference · white inverts everything underneath</p>
      </div>
      <div className="invert-chip invert-chip-a">light</div>
      <div className="invert-chip invert-chip-b">dark</div>
      <div className="invert-lens is-visible" ref={lensRef} />
    </div>
  )
}
