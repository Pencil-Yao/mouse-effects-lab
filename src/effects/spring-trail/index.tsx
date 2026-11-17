import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { SpringTrailEngine, type SpringTrailSettings } from './engine'
import './styles.css'

export default function SpringTrail({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as SpringTrailSettings)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new SpringTrailEngine(canvas, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return <canvas ref={canvasRef} className="spring-trail-canvas" />
}
