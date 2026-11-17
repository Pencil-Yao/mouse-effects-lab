import { useEffect, useRef, useState } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { FluidCursorEngine, type FluidSettings } from './engine'
import './styles.css'

export default function FluidCursor({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as FluidSettings)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: FluidCursorEngine | undefined
    try {
      engine = new FluidCursorEngine(canvas, () => settingsRef.current)
    } catch (error) {
      console.warn('FluidCursor: WebGL context unavailable', error)
      setFailed(true)
      return
    }
    return () => engine?.destroy()
  }, [settingsRef])

  return (
    <>
      <canvas ref={canvasRef} className="fluid-cursor-canvas" />
      {failed && (
        <div className="webgl-fallback">
          <strong>WebGL unavailable</strong>
          <span>Scroll away and back to retry, or close other GPU-heavy tabs.</span>
        </div>
      )}
    </>
  )
}
