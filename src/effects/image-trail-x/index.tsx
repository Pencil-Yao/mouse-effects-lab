import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { ImageTrailXEngine, type ImageTrailXSettings } from './engine'
import './styles.css'

const IMAGES = Array.from({ length: 7 }, (_, i) => `art/image-trail-x/${String(i + 1).padStart(2, '0')}.jpg`)
const POOL = 18

export default function ImageTrailX({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement[]>([])
  const settingsRef = useLatest(settings as unknown as ImageTrailXSettings)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = itemsRef.current.filter(Boolean)
    const engine = new ImageTrailXEngine(root, items, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.style.setProperty('--itx-size', `${settings.imageSize}px`)
    root.style.setProperty('--itx-brightness', String(settings.brightness))
  }, [settings.imageSize, settings.brightness])

  return (
    <div className="image-trail-x-root" ref={rootRef}>
      <div className="image-trail-x-bg" aria-hidden="true">
        eight
        <br />
        trails
      </div>
      {Array.from({ length: POOL }, (_, i) => (
        <div
          className="image-trail-x-item"
          key={i}
          ref={(node) => {
            if (node) itemsRef.current[i] = node
          }}
        >
          <div
            className="image-trail-x-inner"
            style={{ backgroundImage: `url(${IMAGES[i % IMAGES.length]})` }}
          />
        </div>
      ))}
    </div>
  )
}
