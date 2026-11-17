import { useRef } from 'react'

/** Keeps a ref pointing at the newest value without re-running effects. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}
