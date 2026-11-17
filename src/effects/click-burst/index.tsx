import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { ClickBurstEngine, type ClickBurstSettings } from './engine'
import './styles.css'

export default function ClickBurst({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as ClickBurstSettings)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new ClickBurstEngine(canvas, () => settingsRef.current)
    return () => engine.destroy()
  }, [settingsRef])

  return <canvas ref={canvasRef} className="click-burst-canvas" />
}
