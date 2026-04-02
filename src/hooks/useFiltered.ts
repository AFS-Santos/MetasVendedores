import { useMemo } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useUIStore } from '../stores/useUIStore'

/** Returns vendedores filtered by the current filial tab */
export function useFiltered() {
  const vendedores = useDataStore(s => s.vendedores)
  const currentFilial = useUIStore(s => s.currentFilial)

  return useMemo(() => {
    if (currentFilial === 'TODOS') return [...vendedores]
    return vendedores.filter(v => v.filial === currentFilial)
  }, [vendedores, currentFilial])
}
