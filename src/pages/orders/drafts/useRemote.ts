import { useEffect, useRef, useState } from 'react'

interface RemoteState<T> {
  key: string | null
  data?: T
  error?: string
}

/**
 * Loads data for a key and keeps the last result. Loading is derived from the key, so
 * nothing is set synchronously inside the effect. A null key skips loading.
 */
export function useRemote<T>(key: string | null, load: () => Promise<T>, onData?: (data: T) => void) {
  const [state, setState] = useState<RemoteState<T>>({ key: null })
  const loadRef = useRef(load)
  const onDataRef = useRef(onData)

  useEffect(() => {
    loadRef.current = load
    onDataRef.current = onData
  })

  useEffect(() => {
    if (key == null) return
    let cancelled = false
    loadRef.current().then(
      (data) => {
        if (cancelled) return
        setState({ key, data })
        onDataRef.current?.(data)
      },
      (err) => {
        if (!cancelled) setState({ key, error: err instanceof Error ? err.message : 'Request failed' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [key])

  const current = key != null && state.key === key
  return {
    data: state.data,
    error: current ? state.error : undefined,
    loading: key != null && state.key !== key,
  }
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
