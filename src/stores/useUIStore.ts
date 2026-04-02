import { create } from 'zustand'
import type { RankingType } from '../schemas/vendedor'

interface UIState {
  currentFilial: string
  activeRanking: RankingType
  chartMode: 'markup' | 'pct'

  setCurrentFilial: (f: string) => void
  setActiveRanking: (r: RankingType) => void
  setChartMode: (m: 'markup' | 'pct') => void
}

export const useUIStore = create<UIState>((set) => ({
  currentFilial: 'TODOS',
  activeRanking: 'venda',
  chartMode: 'markup',

  setCurrentFilial: (f) => set({ currentFilial: f }),
  setActiveRanking: (r) => set({ activeRanking: r }),
  setChartMode: (m) => set({ chartMode: m }),
}))
