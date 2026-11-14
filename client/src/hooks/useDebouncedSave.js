import { useRef, useCallback, useEffect } from 'react'

// Debounced saver that never drops a pending edit: schedule(fn) runs fn after
// `delay` ms of quiet, and flush() runs it immediately. It flushes on unmount
// and when the tab is hidden/closed, and callers flush before switching
// entries or campaigns. `fn` must capture the target id it is saving to.
export function useDebouncedSave(delay = 800) {
  const timer = useRef(null)
  const pending = useRef(null)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = null
    const fn = pending.current
    pending.current = null
    return fn ? fn() : undefined
  }, [])

  const schedule = useCallback((fn, ms = delay) => {
    pending.current = fn
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, ms)
  }, [flush, delay])

  useEffect(() => {
    const onHide = () => { if (document.visibilityState !== 'visible') flush() }
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  return { schedule, flush }
}
