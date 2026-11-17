import { useEffect, useRef, useState } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { MaskRevealEngine, type MaskRevealSettings } from './engine'
import './styles.css'

export default function MaskReveal({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as MaskRevealSettings)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: MaskRevealEngine | undefined
    try {
      engine = new MaskRevealEngine(canvas, () => settingsRef.current)
    } catch (error) {
      console.warn('MaskReveal: WebGL context unavailable', error)
      setFailed(true)
      return
    }
    return () => engine?.destroy()
  }, [settingsRef])

  return (
    <>
      <canvas ref={canvasRef} className="mask-reveal-canvas" />
      {failed && (
        <div className="webgl-fallback">
          <strong>WebGL unavailable</strong>
          <span>Scroll away and back to retry, or close other GPU-heavy tabs.</span>
        </div>
      )}
    </>
  )
}
