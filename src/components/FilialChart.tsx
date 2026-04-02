import { useState, useEffect, useRef } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useUIStore } from '../stores/useUIStore'
import { pct } from '../lib/formatters'

const CORES = [
  '#f5c842', '#4a90e2', '#2ecc71', '#e74c3c',
  '#c0c8d8', '#cd7f32', '#bb8fce', '#5dade2',
]

export function FilialChart() {
  const vendedores = useDataStore(s => s.vendedores)
  const regras = useDataStore(s => s.regras)
  const chartMode = useUIStore(s => s.chartMode)
  const setChartMode = useUIStore(s => s.setChartMode)
  const [animated, setAnimated] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Trigger animation on mount / data change
  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [vendedores, chartMode])

  const filiais = [...new Set(vendedores.map(v => v.filial))].sort()

  const dados = filiais.map(f => {
    const grupo = vendedores.filter(v => v.filial === f)
    if (chartMode === 'markup') {
      const mks = grupo.filter(v => v.markup > 0).map(v => v.markup)
      const val = mks.length ? mks.reduce((a, b) => a + b, 0) / mks.length : 0
      return { label: f, val: Math.round(val * 100) / 100, suffix: '%', count: grupo.length }
    } else {
      const tv = grupo.reduce((s, v) => s + (v.venda || 0), 0)
      const tm = grupo.reduce((s, v) => s + (v.meta || 0), 0)
      return { label: f, val: pct(tv, tm), suffix: '%', count: grupo.length }
    }
  })

  const maxVal = Math.max(...dados.map(d => d.val), 1)
  const BAR_H = 160

  // Meta reference line from regras (not hardcoded)
  const metaLine = chartMode === 'markup' ? regras.mkMin : regras.metaMin
  const metaLineY = Math.min((metaLine / maxVal) * BAR_H, BAR_H)

  return (
    <div className="mt-4 sm:mt-5 bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <span className="font-display text-sm sm:text-base tracking-[2.5px] text-gold">📊 Desempenho por Filial</span>
        <div className="flex gap-1.5">
          {(['markup', 'pct'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setChartMode(mode)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[0.68rem] sm:text-xs font-semibold transition-all
                ${chartMode === mode ? 'bg-gold text-bg' : 'text-muted2 hover:text-text hover:bg-surface2'}`}
            >
              {mode === 'markup' ? 'Markup Médio' : '% Meta'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-5 pb-5 sm:pb-6" ref={containerRef}>
        <div className="flex items-end gap-1.5 sm:gap-2.5 relative" style={{ height: BAR_H + 50, paddingBottom: 32 }}>
          {/* Baseline */}
          <div className="absolute bottom-8 left-0 right-0 h-px bg-border" />

          {/* Meta reference line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-muted/30 pointer-events-none transition-all duration-700"
            style={{ bottom: 8 + metaLineY + 24 }}
          >
            <span className="absolute -top-3 right-0 text-[0.55rem] text-muted2 bg-surface px-1">
              {chartMode === 'markup' ? `Mk ${metaLine}%` : `Meta ${metaLine}%`}
            </span>
          </div>

          {dados.map((d, i) => {
            const h = animated && maxVal > 0 ? Math.max(Math.round((d.val / maxVal) * BAR_H), 4) : 4
            const cor = CORES[i % CORES.length]!
            const label = d.label.length > 7 ? d.label.slice(0, 7) + '…' : d.label
            const isHovered = hoveredIdx === i

            return (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end relative min-w-0"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface2 border border-border rounded-lg px-2.5 py-1.5 z-10 whitespace-nowrap animate-fade-in shadow-lg">
                    <div className="text-xs font-bold text-text">{d.label}</div>
                    <div className="text-[0.65rem] text-muted2">{d.count} vendedores · {d.val > 0 ? (d.val % 1 === 0 ? d.val : d.val.toFixed(2)) + d.suffix : '—'}</div>
                  </div>
                )}

                {/* Value above bar */}
                <div className="font-display text-[0.65rem] sm:text-xs tracking-wide whitespace-nowrap text-text mb-1 opacity-80">
                  {d.val > 0 ? (d.val % 1 === 0 ? d.val : d.val.toFixed(2)) + d.suffix : '—'}
                </div>

                {/* Bar */}
                <div
                  className="w-full rounded-t-md relative cursor-default min-h-[4px]"
                  style={{
                    height: h,
                    background: `linear-gradient(to top, ${cor}, ${cor}dd)`,
                    transition: 'height 0.8s cubic-bezier(0.23,1,0.32,1)',
                    filter: isHovered ? 'brightness(1.25)' : 'brightness(1)',
                    boxShadow: isHovered ? `0 0 12px ${cor}40` : 'none',
                  }}
                />

                {/* Label below */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.5rem] sm:text-[0.58rem] font-bold tracking-wide text-muted2 whitespace-nowrap text-center">
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
