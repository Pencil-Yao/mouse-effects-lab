import { useEffect, useRef, useState } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import { PixelParticlesEngine, type PixelParticlesSettings } from './engine'
import './styles.css'

export default function PixelParticles({ settings }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useLatest(settings as unknown as PixelParticlesSettings)
  const [failed, setFailed] = useState(false)
  const image = settings.image
  const resolution = settings.resolution

  useEffect(() => {
    setFailed(false)
  }, [image, resolution])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: PixelParticlesEngine | undefined
    try {
      engine = new PixelParticlesEngine(canvas, () => settingsRef.current)
    } catch (error) {
      console.warn('PixelParticles: WebGL context unavailable', error)
      setFailed(true)
      return
    }
    return () => engine?.destroy()
  }, [settingsRef, image, resolution])

  return (
    <>
      <canvas key={`${image}-${resolution}`} ref={canvasRef} className="pixel-particles-canvas" />
      {failed && (
        <div className="webgl-fallback">
          <strong>WebGL unavailable</strong>
          <span>Scroll away and back to retry, or close other GPU-heavy tabs.</span>
        </div>
      )}
    </>
  )
}
