import * as React from 'react'

export function useMediaQuery(minWidthPx: number) {
  const query = `(min-width: ${minWidthPx}px)`

  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query],
  )

  const getServerSnapshot = React.useCallback(() => true, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
