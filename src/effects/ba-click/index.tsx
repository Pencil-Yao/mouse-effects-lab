import { useEffect, useRef, useState } from 'react'
import type { BAClickFX as BAClickFXInstance } from 'ba-click-fx'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface BAClickSettings {
  color: string
  scale: number
  opacity: number
  trail: boolean
  click: boolean
  trailAlways: boolean
  backend: 'auto' | 'webgl2' | 'canvas2d'
  clickSpeed: number
  trailSpeed: number
}

/**
 * Blue Archive-style click rings, shards and cursor trail.
 * This card integrates the actual MIT `ba-click-fx` package (v1.3.15)
 * instead of copying its runtime.
 */
export default function BAClick({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<BAClickFXInstance | null>(null)
  const settingsRef = useLatest(settings as unknown as BAClickSettings)
  const [failed, setFailed] = useState(false)

  const applySettings = (fx: BAClickFXInstance, s: BAClickSettings) => {
    try {
      fx.setThemeColor(s.color)
      fx.updateConfig({
        scale: s.scale,
        opacity: s.opacity,
        trailEnabled: s.trail,
        clickEnabled: s.click,
        trailAlways: s.trailAlways,
        effectBackend: s.backend,
        clickTimeScale: s.clickSpeed,
        trailTimeScale: s.trailSpeed,
      })
    } catch (error) {
      console.warn('BAClick: config update failed', error)
    }
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let cancelled = false
    let fx: BAClickFXInstance | null = null

    import('ba-click-fx')
      .then(({ BAClickFX }) => {
        if (cancelled) return
        const s = settingsRef.current
        fx = new BAClickFX({
          target: root,
          themeColor: s.color,
          scale: s.scale,
          opacity: s.opacity,
          trailEnabled: s.trail,
          clickEnabled: s.click,
          trailAlways: s.trailAlways,
          effectBackend: s.backend,
          clickTimeScale: s.clickSpeed,
          trailTimeScale: s.trailSpeed,
          outputCompositing: 'browser-overlay',
          hostCompositing: 'screen',
          hostCompositingSurface: 'dom-backdrop',
          webgpuPreferHdr: false,
          maxDpr: 2,
          touchAction: 'none',
        })
        fxRef.current = fx
        applySettings(fx, s)
      })
      .catch((error) => {
        console.warn('BAClick: failed to initialise ba-click-fx', error)
        setFailed(true)
      })

    const onLeave = () => {
      try {
        fx?.pointerCancel()
        fx?.clearTrail()
      } catch {
        /* library already destroyed */
      }
    }
    const onBlur = () => onLeave()
    root.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onBlur)

    return () => {
      cancelled = true
      root.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onBlur)
      fx?.destroy()
      fxRef.current = null
    }
  }, [settingsRef])

  useEffect(() => {
    const fx = fxRef.current
    if (!fx) return
    applySettings(fx, settings as unknown as BAClickSettings)
  }, [settings])

  return (
    <div className="ba-root" ref={rootRef}>
      <div className="ba-copy" aria-hidden="true">
        <span>BLUE ARCHIVE FX · UNITY DEFAULTS</span>
        <h4>Click / Trail</h4>
        <p>Move for the continuous trail, click or drag for dissolving rings and shards.</p>
      </div>
      <div className="ba-targets" aria-hidden="true">
        <span>CLICK</span>
        <span>DRAG</span>
        <span>MOVE</span>
      </div>
      {failed && (
        <div className="webgl-fallback">
          <strong>BA Click FX unavailable</strong>
          <span>Scroll away and back to retry.</span>
        </div>
      )}
    </div>
  )
}
