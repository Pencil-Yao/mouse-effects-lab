import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { ConstellationEngine, type ConstellationSettings } from './engine'
import './styles.css'

export default function Constellation({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as ConstellationSettings)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const engine = new ConstellationEngine(root, canvas, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return (
    <div className="constellation-root" ref={rootRef}>
      <canvas ref={canvasRef} className="constellation-canvas" />
      <div className="constellation-copy">
        <span>GRAPH + DISTANCE FIELD</span>
        <h4>Constellation</h4>
        <p>Drifting stars link to each other and to the pointer. Click to pulse the network.</p>
      </div>
    </div>
  )
}
