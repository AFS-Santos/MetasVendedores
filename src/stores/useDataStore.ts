import { create } from 'zustand'
import type { Vendedor, Regras } from '../schemas/vendedor'
import { REGRAS_DEFAULT } from '../schemas/vendedor'
import { fetchVendedores, pushVendedores, fetchDriveFotos } from '../lib/sheetsApi'
import { preloadR2Photos } from '../lib/r2Photos'

// ── LocalStorage helpers ──

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('localStorage quota exceeded:', e)
  }
}

// ── Types ──

export type SyncStatus = 'local' | 'ok' | 'err' | 'loading'

interface DataState {
  vendedores: Vendedor[]
  regras: Regras
  drivePhotos: Record<string, string>
  sheetsUrl: string
  campanhaEncerrada: boolean
  syncStatus: SyncStatus
  lastSyncTime: number
  syncError: string | null

  setVendedores: (v: Vendedor[]) => void
  updateVendedor: (id: string, data: Partial<Vendedor>) => void
  addVendedor: (v: Vendedor) => void
  setRegras: (r: Regras) => void
  setSheetsUrl: (url: string) => void
  setCampanhaEncerrada: (v: boolean) => void
  syncFromSheets: () => Promise<void>
  pushToSheets: () => Promise<void>

  // Computed
  filiais: () => string[]
}

// ── Store ──

export const useDataStore = create<DataState>((set, get) => ({
  vendedores: loadFromStorage('mt_vend', []),
  regras: loadFromStorage('mt_regras', { ...REGRAS_DEFAULT, premios: [...REGRAS_DEFAULT.premios] as [number, number, number] }),
  drivePhotos: loadFromStorage('mt_drive_fotos', {}),
  sheetsUrl: localStorage.getItem('mt_sheets') || '',
  campanhaEncerrada: loadFromStorage('mt_campanha_encerrada', false),
  // Se tem URL configurada, começa como loading — vai buscar dado real imediatamente
  // Se não tem URL, começa como local — usuário ainda não configurou
  syncStatus: localStorage.getItem('mt_sheets') ? 'loading' : 'local',
  lastSyncTime: 0,
  syncError: null,

  setVendedores: (vendedores) => {
    set({ vendedores })
    saveToStorage('mt_vend', vendedores)
  },

  updateVendedor: (id, data) => {
    const { vendedores, sheetsUrl } = get()
    const updated = vendedores.map(v => v.id === id ? { ...v, ...data } : v)
    set({ vendedores: updated })
    saveToStorage('mt_vend', updated)
    if (sheetsUrl) get().pushToSheets()
  },

  addVendedor: (v) => {
    const { vendedores, sheetsUrl } = get()
    const updated = [...vendedores, v]
    set({ vendedores: updated })
    saveToStorage('mt_vend', updated)
    if (sheetsUrl) get().pushToSheets()
  },

  setRegras: (regras) => {
    set({ regras })
    saveToStorage('mt_regras', regras)
  },

  setSheetsUrl: (url) => {
    set({ sheetsUrl: url })
    localStorage.setItem('mt_sheets', url)
  },

  setCampanhaEncerrada: (v) => {
    set({ campanhaEncerrada: v })
    saveToStorage('mt_campanha_encerrada', v)
  },

  syncFromSheets: async () => {
    const { sheetsUrl } = get()
    if (!sheetsUrl) return

    set({ syncStatus: 'loading', syncError: null })
    try {
      // Busca vendedores e fotos em paralelo — reduz tempo total de sync
      const [data, fotosData] = await Promise.all([
        fetchVendedores(sheetsUrl),
        fetchDriveFotos(sheetsUrl).catch(() => null),
      ])

      const vendedores = data.vendedores
      set({ vendedores, syncStatus: 'ok', lastSyncTime: Date.now() })
      saveToStorage('mt_vend', vendedores)

      preloadR2Photos(vendedores).catch(() => {})

      if (fotosData?.fotos) {
        set({ drivePhotos: fotosData.fotos })
        saveToStorage('mt_drive_fotos', fotosData.fotos)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      set({ syncStatus: 'err', syncError: msg })
      throw err
    }
  },

  pushToSheets: async () => {
    const { sheetsUrl, vendedores } = get()
    if (!sheetsUrl) return
    try {
      await pushVendedores(sheetsUrl, vendedores)
      set({ syncStatus: 'ok' })
    } catch (e) {
      console.error('pushSheets:', e)
      set({ syncStatus: 'err' })
    }
  },

  filiais: () => [...new Set(get().vendedores.map(v => v.filial))].sort(),
}))
