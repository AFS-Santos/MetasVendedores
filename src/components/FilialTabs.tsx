import { useDataStore } from '../stores/useDataStore'
import { useUIStore } from '../stores/useUIStore'

export function FilialTabs() {
  const vendedores = useDataStore(s => s.vendedores)
  const currentFilial = useUIStore(s => s.currentFilial)
  const setCurrentFilial = useUIStore(s => s.setCurrentFilial)
  const filiais = useDataStore(s => s.filiais())

  return (
    <div className="flex gap-1.5 flex-wrap mb-6 p-1.5 bg-surface border border-border rounded-xl">
      <button
        onClick={() => setCurrentFilial('TODOS')}
        className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap
          ${currentFilial === 'TODOS'
            ? 'bg-gold text-bg'
            : 'text-muted2 hover:text-text hover:bg-surface2'}`}
      >
        🌐 Todas
        <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[0.62rem] ml-1.5
          ${currentFilial === 'TODOS' ? 'bg-black/20' : 'bg-white/15'}`}>
          {vendedores.length}
        </span>
      </button>

      {filiais.map(f => {
        const count = vendedores.filter(v => v.filial === f).length
        return (
          <button
            key={f}
            onClick={() => setCurrentFilial(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap
              ${currentFilial === f
                ? 'bg-gold text-bg'
                : 'text-muted2 hover:text-text hover:bg-surface2'}`}
          >
            {f}
            <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[0.62rem] ml-1.5
              ${currentFilial === f ? 'bg-black/20' : 'bg-white/15'}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
