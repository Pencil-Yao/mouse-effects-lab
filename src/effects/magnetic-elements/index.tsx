import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { MagneticEngine, type MagneticSettings } from './engine'
import './styles.css'

const TILES = ['01', '02', '03', '04', '05', '06']

export default function MagneticElements({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as MagneticSettings)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const engine = new MagneticEngine(root, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return (
    <div className="magnetic-root" ref={rootRef}>
      <div className="magnetic-ring" aria-hidden="true" />
      {TILES.map((tile) => (
        <button className="magnetic-item" key={tile}>
          <span className="magnetic-dot" />
          <span className="magnetic-label">{tile}</span>
        </button>
      ))}
      <p className="magnetic-caption">move between the tiles</p>
    </div>
  )
}
