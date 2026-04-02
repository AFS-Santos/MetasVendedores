import { useEffect, useRef } from 'react'
import { useDataStore } from '../stores/useDataStore'

// Sync a cada 30s quando visível, máximo 5min em background
const SYNC_INTERVAL   = 30_000
const SYNC_BG_MAX     = 300_000
const VISIBILITY_MIN  = 15_000   // re-sync se ficar 15s sem foco

export function useAutoSync() {
  const sheetsUrl     = useDataStore(s => s.sheetsUrl)
  const syncFromSheets = useDataStore(s => s.syncFromSheets)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingRef    = useRef(false)

  const doSync = async () => {
    if (!sheetsUrl || syncingRef.current) return
    syncingRef.current = true
    try {
      await syncFromSheets()
    } catch {
      // erro tratado no store
    } finally {
      syncingRef.current = false
    }
  }

  // Sync imediato ao conectar URL
  useEffect(() => {
    if (sheetsUrl) doSync()
  }, [sheetsUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling periódico
  useEffect(() => {
    if (!sheetsUrl) return
    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        const elapsed   = Date.now() - useDataStore.getState().lastSyncTime
        const isVisible = !document.hidden
        if (isVisible || elapsed >= SYNC_BG_MAX) await doSync()
        schedule()
      }, SYNC_INTERVAL)
    }
    schedule()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [sheetsUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync ao voltar para a aba
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
