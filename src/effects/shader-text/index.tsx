import { useEffect, useRef, useState } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { ShaderTextEngine, type ShaderTextSettings } from './engine'
import './styles.css'

export default function ShaderText({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as ShaderTextSettings)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: ShaderTextEngine | undefined
    try {
      engine = new ShaderTextEngine(canvas, () => settingsRef.current)
    } catch (error) {
      console.warn('ShaderText: WebGL context unavailable', error)
      setFailed(true)
      return
    }
    return () => engine?.destroy()
  }, [settingsRef])

  return (
    <>
      <canvas ref={canvasRef} className="shader-text-canvas" />
      {failed && (
        <div className="webgl-fallback">
          <strong>WebGL unavailable</strong>
          <span>Scroll away and back to retry, or close other GPU-heavy tabs.</span>
        </div>
      )}
    </>
  )
}
