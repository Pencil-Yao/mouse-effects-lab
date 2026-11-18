import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import '../cursorkit/effects/radar.js'
import './styles.css'

/**
 * Mounts CursorKit's original <cursor-radar> Web Component inside the card.
 * The host is scoped to this element and the themed/hide-native-cursor
 * layer is disabled so the page keeps its native cursor. Pointer and click
 * behaviour comes from CursorKit's own implementation (MIT).
 */
export default function Radar(_props: EffectProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = hostRef.current
    if (!root) return
    const el = document.createElement('cursor-radar')
    el.setAttribute('no-cursor', '')
    el.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;'
    root.appendChild(el)
    return () => el.remove()
  }, [])

  return <div className="cursorkit-stage radar-stage" ref={hostRef} />
}
