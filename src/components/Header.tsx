import { useState } from 'react'
import { useDataStore } from '../stores/useDataStore'

interface HeaderProps {
  onOpenAdd: () => void
  onOpenRegras: () => void
  onOpenMassEdit: () => void
  onPdfRanking: () => void
  onPdfPodio: () => void
  onPdfFilial: () => void
  onPdfEncerramento: () => void
}

export function Header({ onOpenAdd, onOpenRegras, onOpenMassEdit, onPdfRanking, onPdfPodio, onPdfFilial, onPdfEncerramento }: HeaderProps) {
  const campanhaEncerrada = useDataStore(s => s.campanhaEncerrada)
  const setCampanhaEncerrada = useDataStore(s => s.setCampanhaEncerrada)
  const [menuOpen, setMenuOpen] = useState(false)

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"

  return (
    <header className="py-4 sm:py-6 border-b border-border mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl tracking-widest text-gold leading-none flex-shrink-0">
            ⚡ DENSUL
          </h1>
          <span className="text-[0.6rem] sm:text-xs text-muted2 tracking-widest uppercase truncate hidden sm:block">
            Dashboard de Vendas
          </span>
        </div>

        {/* Desktop buttons */}
        <div className="hidden lg:flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setCampanhaEncerrada(!campanhaEncerrada)}
            className={`${btnBase} border flex items-center gap-1.5 ${
              campanhaEncerrada
                ? 'bg-red2/10 text-red2 border-red2/30'
                : 'bg-green2/10 text-green2 border-green2/30'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${campanhaEncerrada ? 'bg-red2' : 'bg-green2'}`} />
            {campanhaEncerrada ? 'Encerrada' : 'Ativa'}
          </button>
          <button onClick={onOpenRegras} className={`${btnBase} bg-blue2/10 text-muted2 border border-border hover:border-blue2 hover:text-blue2`}>⚙️ Regras</button>
          <button onClick={onPdfRanking} className={`${btnBase} bg-red2/10 text-red2 border border-red2/30 hover:bg-red2/20`}>📄 PDF Geral</button>
          <button onClick={onPdfPodio} className={`${btnBase} bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20`}>🏆 PDF Pódio</button>
          <button onClick={onPdfFilial} className={`${btnBase} bg-blue2/10 text-blue2 border border-blue2/30 hover:bg-blue2/20`}>🏢 PDF Filial</button>
          <button onClick={onPdfEncerramento} className={`${btnBase} bg-red2/10 text-red2 border border-red2/30 hover:bg-red2/20`}>🏆 Encerramento</button>
          <button onClick={onOpenMassEdit} className={`${btnBase} bg-green2/10 text-green2 border border-green2/30 hover:bg-green2/20`}>✏️ Edição</button>
          <button onClick={onOpenAdd} className={`${btnBase} bg-gold text-bg hover:bg-gold2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/25`}>+ Vendedor</button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden px-2 py-1.5 rounded-lg border border-border text-muted2 hover:text-gold hover:border-gold transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden mt-3 grid grid-cols-2 gap-2 animate-fade-in">
          <button
            onClick={() => { setCampanhaEncerrada(!campanhaEncerrada); setMenuOpen(false) }}
            className={`${btnBase} border flex items-center justify-center gap-1.5 py-2.5 col-span-2 ${
              campanhaEncerrada
                ? 'bg-red2/10 text-red2 border-red2/30'
                : 'bg-green2/10 text-green2 border-green2/30'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${campanhaEncerrada ? 'bg-red2' : 'bg-green2'}`} />
            Campanha: {campanhaEncerrada ? 'Encerrada' : 'Ativa'}
          </button>
          <button onClick={() => { onOpenRegras(); setMenuOpen(false) }} className={`${btnBase} bg-blue2/10 text-muted2 border border-border py-2.5 text-center`}>⚙️ Regras</button>
          <button onClick={() => { onPdfRanking(); setMenuOpen(false) }} className={`${btnBase} bg-red2/10 text-red2 border border-red2/30 py-2.5 text-center`}>📄 PDF Geral</button>
          <button onClick={() => { onPdfPodio(); setMenuOpen(false) }} className={`${btnBase} bg-gold/10 text-gold border border-gold/30 py-2.5 text-center`}>🏆 PDF Pódio</button>
          <button onClick={() => { onPdfFilial(); setMenuOpen(false) }} className={`${btnBase} bg-blue2/10 text-blue2 border border-blue2/30 py-2.5 text-center`}>🏢 PDF Filial</button>
          <button onClick={() => { onPdfEncerramento(); setMenuOpen(false) }} className={`${btnBase} bg-red2/10 text-red2 border border-red2/30 py-2.5 text-center col-span-2`}>🏆 Encerramento</button>
          <button onClick={() => { onOpenMassEdit(); setMenuOpen(false) }} className={`${btnBase} bg-green2/10 text-green2 border border-green2/30 py-2.5 text-center`}>✏️ Edição</button>
          <button onClick={() => { onOpenAdd(); setMenuOpen(false) }} className={`${btnBase} bg-gold text-bg py-2.5 col-span-2 text-center`}>+ Vendedor</button>
        </div>
      )}
    </header>
  )
}
