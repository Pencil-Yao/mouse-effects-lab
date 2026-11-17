import { useEffect, useRef } from 'react'
import type { EffectProps } from '../../types'
import { useLatest } from '../../hooks/useLatest'
import './styles.css'

interface BlobSettings {
  size: number
  trail: number
  color: string
  opacity: number
  lerp: number
  clickAnim: boolean
}

const CLICK_COLORS = ['#7c5cfc', '#5cf4fc', '#fc5cb8', '#5cfca8', '#fca85c', '#ff4455']

/**
 * SVG gooey cursor: a lead blob plus a lerped trail, all merged by a
 * feGaussianBlur + feColorMatrix filter. Reconstructed from CursorX
 * (MIT) `MorphingBlobCursor.jsx`.
 */
export default function MorphingBlob({ settings }: EffectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const settingsRef = useLatest(settings as unknown as BlobSettings)

  useEffect(() => {
    const root = rootRef.current
    const target = targetRef.current
    if (!root || !target) return

    const filterId = `blob-goo-${Math.random().toString(36).slice(2)}`
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;'
    svg.innerHTML = `<defs><filter id="${filterId}">
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur"/>
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/>
    </filter></defs>`
    root.appendChild(svg)

    const wrapper = document.createElement('div')
    wrapper.className = 'blob-goo'
    wrapper.style.filter = `url(#${filterId})`
    root.appendChild(wrapper)

    const morph = document.createElement('div')
    morph.className = 'blob-morph'
    root.appendChild(morph)

    let blobs: { el: HTMLDivElement; x: number; y: number }[] = []
    let mx = -200
    let my = -200
    let active = false
    let raf = 0
    let clickIndex = 0
    let clickColor: string | null = null
    let currentTrail = -1
    let currentSize = -1
    let currentColor = ''
    let lastSettingColor = settingsRef.current.color

    const build = () => {
      blobs.forEach((b) => b.el.remove())
      blobs = []
      const s = settingsRef.current
      const color = clickColor ?? s.color
      const lead = s.size
      const trail = lead * 0.72
      const sizes = [lead, ...Array.from({ length: Math.max(0, Math.round(s.trail)) }, () => trail)]
      sizes.forEach((size) => {
        const el = document.createElement('div')
        el.className = 'blob-dot'
        el.style.width = `${Math.max(size, 6)}px`
        el.style.height = `${Math.max(size, 6)}px`
        el.style.background = color
        wrapper.appendChild(el)
        blobs.push({ el, x: -200, y: -200 })
      })
      currentTrail = s.trail
      currentSize = s.size
      currentColor = color
    }

    build()

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      mx = event.clientX - rect.left
      my = event.clientY - rect.top
      active = true
    }

    const onLeave = () => {
      active = false
      mx = -200
      my = -200
      wrapper.style.opacity = '0'
      morph.style.opacity = '0'
    }

    const onClick = () => {
      if (!settingsRef.current.clickAnim) return
      clickIndex = (clickIndex + 1) % CLICK_COLORS.length
      clickColor = CLICK_COLORS[clickIndex]
      build()
    }

    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerenter', onMove)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerdown', onClick)

    const loop = () => {
      const s = settingsRef.current
      if (s.color !== lastSettingColor) {
        lastSettingColor = s.color
        clickColor = null
        build()
      }
      if (s.trail !== currentTrail || s.size !== currentSize || (clickColor ?? s.color) !== currentColor) {
        build()
      }

      const rect = root.getBoundingClientRect()
      const under = document.elementFromPoint(rect.left + mx, rect.top + my)
      const overTarget = active && under?.closest('.blob-target') === target

      if (overTarget) {
        const tr = target.getBoundingClientRect()
        morph.style.left = `${tr.left - rect.left - 5}px`
        morph.style.top = `${tr.top - rect.top - 5}px`
        morph.style.width = `${tr.width + 10}px`
        morph.style.height = `${tr.height + 10}px`
        morph.style.borderRadius = getComputedStyle(target).borderRadius
        morph.style.background = clickColor ?? s.color
        morph.style.opacity = String(s.opacity * 0.6)
        wrapper.style.opacity = '0'
      } else {
        morph.style.opacity = '0'
        wrapper.style.opacity = active ? String(s.opacity) : '0'
      }

      if (blobs[0]) {
        blobs[0].x = mx
        blobs[0].y = my
        blobs[0].el.style.left = `${mx}px`
        blobs[0].el.style.top = `${my}px`
      }

      for (let i = 1; i < blobs.length; i++) {
        const prev = blobs[i - 1]
        blobs[i].x += (prev.x - blobs[i].x) * s.lerp
        blobs[i].y += (prev.y - blobs[i].y) * s.lerp
        blobs[i].el.style.left = `${blobs[i].x}px`
        blobs[i].el.style.top = `${blobs[i].y}px`
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onMove)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerdown', onClick)
      blobs.forEach((b) => b.el.remove())
      wrapper.remove()
      morph.remove()
      svg.remove()
    }
  }, [settingsRef])

  return (
    <div className="blob-root" ref={rootRef}>
      <div className="blob-copy">
        <span>SVG GOOEY FILTER</span>
        <h4>Morphing Blob</h4>
        <p>Lead blob + lerped trail, fused by feGaussianBlur and feColorMatrix.</p>
      </div>
      <div className="blob-target" ref={targetRef}>
        morph target
      </div>
    </div>
  )
}
