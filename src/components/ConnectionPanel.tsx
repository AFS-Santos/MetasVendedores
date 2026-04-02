import { useState, useEffect } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useToast } from '../hooks/useToast'

const badgeStyles = {
  local:   'bg-muted/20 text-muted2',
  ok:      'bg-green2/15 text-green2',
  err:     'bg-red2/15 text-red2',
  loading: 'bg-gold/15 text-gold',
}

const badgeLabels = {
  local:   '● LOCAL',
  ok:      '● SHEETS',
  err:     '● ERRO',
  loading: '◌ SYNC...',
}

function formatLastSync(ts: number): string {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5)  return 'agora'
  if (diff < 60) return `${diff}s atrás`
  const min = Math.floor(diff / 60)
  return `${min}min atrás`
}

export function ConnectionPanel() {
  const sheetsUrl     = useDataStore(s => s.sheetsUrl)
  const setSheetsUrl  = useDataStore(s => s.setSheetsUrl)
  const syncStatus    = useDataStore(s => s.syncStatus)
  const syncFromSheets = useDataStore(s => s.syncFromSheets)
  const syncError     = useDataStore(s => s.syncError)
  const lastSyncTime  = useDataStore(s => s.lastSyncTime)
  const toast         = useToast(s => s.show)
  const [inputUrl, setInputUrl] = useState(sheetsUrl)

  // Atualiza o "X atrás" a cada 10s
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const handleTest = async () => {
    const url = inputUrl.trim()
    if (!url) {
      toast('Cole a URL primeiro!', 'err')
      return
    }
    if (url.includes('/spreadsheets/')) {
      toast('Cole a URL do Apps Script — não da planilha!', 'err')
      return
    }
    if (!url.includes('script.google.com')) {
      toast('URL não parece ser do Apps Script', 'err')
      return
    }
    const finalUrl = url.endsWith('/exec') ? url : url.replace(/\/$/, '') + '/exec'
    setInputUrl(finalUrl)
    setSheetsUrl(finalUrl)

    try {
      await syncFromSheets()
      const count = useDataStore.getState().vendedores.length
      toast(`✅ ${count} vendedores sincronizados!`)
    } catch {
      toast('Erro na conexão', 'err')
    }
  }

  const handleSync = async () => {
    if (!sheetsUrl) {
      toast('Cole a URL do Apps Script!', 'err')
      return
    }
    try {
      await syncFromSheets()
      const count = useDataStore.getState().vendedores.length
      toast(`✅ ${count} vendedores sincronizados!`)
    } catch {
      toast('Erro na sincronização', 'err')
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-surface border border-border rounded-xl p-3.5 px-5">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue2/10 border border-blue2/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="3" fill="rgba(74,144,226,0.15)" stroke="rgba(74,144,226,0.5)" strokeWidth="1.2" />
              <path d="M6 7h8M6 10h8M6 13h5" stroke="#4a90e2" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text">
              Google Sheets <span className="text-muted font-normal">—</span> Apps Script
            </div>
            <div className="text-xs text-muted2 mt-0.5">
              Cole a URL do Apps Script para sincronizar os dados
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-end">
          <div className="flex items-center flex-1 min-w-[280px] max-w-[480px]">
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              spellCheck={false}
              className="flex-1 bg-surface2 border border-border border-r-0 rounded-l-lg px-3 py-2 text-text text-xs
                         font-body outline-none focus:border-blue2 transition-colors placeholder:text-muted"
            />
            <button
              onClick={handleTest}
              className="flex items-center gap-1.5 bg-surface2 border border-border rounded-r-lg px-3 py-2
                         text-muted2 text-xs font-semibold hover:text-blue2 hover:border-blue2 transition-all"
            >
              Testar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${badgeStyles[syncStatus]}`}>
                {badgeLabels[syncStatus]}
              </span>
              {syncStatus === 'ok' && lastSyncTime > 0 && (
                <span className="text-[0.58rem] text-muted2 mt-0.5">
                  atualizado {formatLastSync(lastSyncTime)}
                </span>
              )}
            </div>
            <button
              onClick={handleSync}
              disabled={syncStatus === 'loading'}
              className="flex items-center gap-1.5 bg-blue2/10 border border-blue2/25 rounded-lg px-3.5 py-1.5
                         text-blue2 text-xs font-semibold hover:bg-blue2/15 hover:border-blue2/50 transition-all
                         disabled:opacity-50 disabled:cursor-default"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11 2.5A5.5 5.5 0 1 0 12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 1l2.5 1.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sincronizar
            </button>
          </div>
        </div>
      </div>

      {syncStatus === 'err' && syncError && (
        <div className="mt-3 bg-red2/5 border border-red2/25 rounded-lg p-3 px-4 text-sm animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-red2 text-xs">❌ Erro de conexão</strong>
          </div>
          <div className="text-xs text-muted2 leading-relaxed">{syncError}</div>
        </div>
      )}
    </div>
  )
}
