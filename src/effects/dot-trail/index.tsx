import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { DotTrailEngine, type DotTrailSettings } from './engine'
import './styles.css'

export default function DotTrail({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as DotTrailSettings)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new DotTrailEngine(canvas, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return <canvas ref={canvasRef} className="dot-trail-canvas" />
}
