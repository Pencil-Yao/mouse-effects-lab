import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface SpotlightSettings {
  color: string
  size: number
  intensity: number
}

const CARDS = [
  { tag: '01 / surface', title: 'Radial light', body: 'A gradient anchored to the pointer.' },
  { tag: '02 / depth', title: 'CSS variables', body: 'Two custom properties per card.' },
  { tag: '03 / focus', title: 'No re-render', body: 'Styles are written directly in the event.' },
]

/**
 * Per-card spotlight using a pseudo-element radial gradient whose centre is
 * driven by two CSS custom properties. Based on mouse-animations' Spotlight.
 */
export default function SpotlightCards({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as SpotlightSettings)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.spotlight-card'))

    const onMove = (event: PointerEvent) => {
      for (const card of cards) {
        const rect = card.getBoundingClientRect()
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
      }
    }
    const onLeave = () => {
      cards.forEach((card) => {
        card.style.setProperty('--spot-x', '-9999px')
        card.style.setProperty('--spot-y', '-9999px')
      })
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onMove)
    root.addEventListener('pointerleave', onLeave)

    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [settingsRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.querySelectorAll<HTMLElement>('.spotlight-card').forEach((card) => {
      card.style.setProperty('--spot-r', `${settings.size}px`)
      card.style.setProperty('--spot-color', String(settings.color))
      card.style.setProperty('--spot-strength', `${settings.intensity}`)
    })
  }, [settings.size, settings.color, settings.intensity])

  return (
    <div className="spotlight-root" ref={rootRef}>
      {CARDS.map((card) => (
        <article className="spotlight-card" key={card.tag}>
          <span className="spotlight-tag">{card.tag}</span>
          <h4>{card.title}</h4>
          <p>{card.body}</p>
        </article>
      ))}
    </div>
  )
}
