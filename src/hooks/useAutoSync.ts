import { useEffect, useRef } from 'react'
import { useDataStore } from '../stores/useDataStore'

const SYNC_INTERVAL = 60_000
const SYNC_BG_MAX = 300_000
const VISIBILITY_MIN = 30_000

export function useAutoSync() {
  const sheetsUrl = useDataStore(s => s.sheetsUrl)
  const syncFromSheets = useDataStore(s => s.syncFromSheets)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingRef = useRef(false)

  const doSync = async () => {
    if (!sheetsUrl || syncingRef.current) return
    syncingRef.current = true
    try { await syncFromSheets() } catch { /* handled in store */ } finally { syncingRef.current = false }
  }

  useEffect(() => { if (sheetsUrl) doSync() }, [sheetsUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sheetsUrl) return
    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        const now = Date.now()
        const isVisible = !document.hidden
        const elapsed = now - useDataStore.getState().lastSyncTime
        if (isVisible || elapsed >= SYNC_BG_MAX) await doSync()
        schedule()
      }, SYNC_INTERVAL)
    }
    schedule()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [sheetsUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = async () => {
      if (!document.hidden && sheetsUrl) {
        const elapsed = Date.now() - useDataStore.getState().lastSyncTime
        if (elapsed > VISIBILITY_MIN) await doSync()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sheetsUrl]) // eslint-disable-line react-hooks/exhaustive-deps
}
