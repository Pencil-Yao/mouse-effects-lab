import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { FireTrailEngine, type FireTrailSettings } from './engine'
import './styles.css'

export default function FireTrail({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as FireTrailSettings)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const engine = new FireTrailEngine(root, canvas, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return (
    <div className="fire-root" ref={rootRef}>
      <canvas ref={canvasRef} className="fire-canvas" />
      <div className="fire-copy">
        <span>HSL EMBER LIFECYCLE</span>
        <h4>Fire Trail</h4>
        <p>Flames rise, cool from yellow to red, then fade into smoke. Click for a burst.</p>
      </div>
    </div>
  )
}
