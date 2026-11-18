import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { gsap } from 'gsap'
import MouseFollower from './core.js'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

MouseFollower.registerGSAP(gsap)

interface ImageFocusSettings {
  speed: number
  size: number
}

const IMAGES = ['/art/trail/33.jpg', '/art/trail/34.jpg', '/art/trail/35.jpg']

export default function ImageFocus({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<MouseFollower | null>(null)
  const settingsRef = useLatest(settings as unknown as ImageFocusSettings)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const follower = new MouseFollower({
      container: root,
      eventsTarget: root,
      local: true,
      visible: true,
      speed: settingsRef.current.speed,
      skewingMedia: 2,
      stateDetection: { '-pointer': 'a,button,.ifx-tile' },
      hideOnLeave: true,
      hideTimeout: 220,
    })
    followerRef.current = follower
    return () => {
      follower.destroy()
      followerRef.current = null
    }
  }, [settingsRef])

  useEffect(() => {
    const follower = followerRef.current
    if (!follower) return
    follower.options.speed = Number(settings.speed ?? 0.55)
  }, [settings])

  const style = {
    '--ifx-media-size': `${Number(settings.size ?? 340)}px`,
  } as CSSProperties

  return (
    <div ref={rootRef} className="ifx-stage" style={style}>
      <div className="ifx-layout">
        <span className="ifx-kicker">cursor media state · image</span>
        <div className="ifx-grid">
          {IMAGES.map((src, i) => (
            <button className="ifx-tile" type="button" key={src} data-cursor-img={src}>
              <img src={src} alt="" />
              <span className="ifx-tile-kicker">0{i + 1}</span>
              <span className="ifx-tile-label">Frame</span>
            </button>
          ))}
        </div>
        <span className="ifx-hint">the hovered frame is cloned into a circular cursor</span>
      </div>
    </div>
  )
}
