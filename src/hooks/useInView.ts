import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref plus whether the element is near the viewport.
 * Effects are mounted only while near the viewport, which releases WebGL
 * contexts, canvases and listeners when a card is scrolled away.
 */
export function useInView<T extends HTMLElement>(rootMargin = '320px 0px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold: 0.01 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, inView }
}
