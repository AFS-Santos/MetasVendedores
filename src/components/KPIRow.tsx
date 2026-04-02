import { useEffect, useRef, useState } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { fmt, pct } from '../lib/formatters'

/** Animated number counter */
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<ReturnType<typeof requestAnimationFrame>>()

  useEffect(() => {
    const start = display
    const diff = value - start
    if (diff === 0) return
    const duration = 600
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{prefix}{display.toLocaleString('pt-BR')}{suffix}</>
}

export function KPIRow() {
  const vendedores = useDataStore(s => s.vendedores)

  const totalV = vendedores.reduce((s, v) => s + (v.venda || 0), 0)
  const totalM = vendedores.reduce((s, v) => s + (v.meta || 0), 0)
  const atingiu = vendedores.filter(v => (v.venda || 0) >= (v.meta || 0)).length
  const filiais = new Set(vendedores.map(v => v.filial)).size
  const markups = vendedores.filter(v => (v.markup || 0) !== 0).map(v => v.markup)
  const avgMk = markups.length ? (markups.reduce((s, m) => s + m, 0) / markups.length) : 0

  const kpis = [
    { label: 'Total Vendido', value: totalV, render: <><AnimatedValue value={totalV} prefix="R$ " /></>, sub: 'Soma geral', color: 'text-gold', accent: 'bg-gold' },
    { label: 'Meta Geral', value: Math.round(pct(totalV, totalM)), render: <><AnimatedValue value={Math.round(pct(totalV, totalM))} suffix="%" /></>, sub: `${atingiu} / ${vendedores.length} atingida`, color: 'text-green2', accent: 'bg-green2' },
    { label: 'Filiais', value: filiais, render: <>{filiais}</>, sub: 'Ativas', color: 'text-blue2', accent: 'bg-blue2' },
    { label: 'Vendedores', value: vendedores.length, render: <>{vendedores.length}</>, sub: 'Cadastrados', color: 'text-silver', accent: 'bg-silver' },
    { label: 'Markup Médio', value: avgMk, render: <>{avgMk > 0 ? avgMk.toFixed(2) + '%' : '—'}</>, sub: 'Média do time', color: 'text-bronze', accent: 'bg-bronze' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-4 sm:mb-6">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className="bg-surface border border-border rounded-xl px-3 sm:px-4 py-3 sm:py-4 relative overflow-hidden animate-fade-in"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className={`absolute top-0 right-0 w-14 h-14 rounded-bl-[56px] rounded-tr-xl opacity-[0.07] ${kpi.accent}`} />
          <div className="text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-[1.5px] uppercase text-muted2 mb-1">
            {kpi.label}
          </div>
          <div className={`font-display text-xl sm:text-[1.7rem] tracking-wide leading-none ${kpi.color}`}>
            {kpi.render}
          </div>
          <div className="text-[0.62rem] sm:text-[0.68rem] text-muted2 mt-1">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}
