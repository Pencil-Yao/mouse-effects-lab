import { useEffect, useRef, useState } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { WaterRippleEngine, type WaterRippleSettings } from './engine'
import './styles.css'

export default function WaterRipple({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as WaterRippleSettings)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: WaterRippleEngine | undefined
    try {
      engine = new WaterRippleEngine(canvas, () => settingsRef.current)
    } catch (error) {
      console.warn('WaterRipple: WebGL context unavailable', error)
      setFailed(true)
      return
    }
    return () => engine?.destroy()
  }, [settingsRef])

  return (
    <>
      <canvas ref={canvasRef} className="water-ripple-canvas" />
      {failed && (
        <div className="webgl-fallback">
          <strong>WebGL unavailable</strong>
          <span>Scroll away and back to retry, or close other GPU-heavy tabs.</span>
        </div>
      )}
    </>
  )
}
