import { useMemo } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useFiltered } from '../hooks/useFiltered'
import { fmt, pct, fmtPct, elegivelMarkup, barColor, sortVendedores, filterByRanking } from '../lib/formatters'
import { Avatar } from './Avatar'
import type { RankingType } from '../schemas/vendedor'
import type { Vendedor, Regras } from '../schemas/vendedor'

interface RankingSectionProps {
  type: RankingType
  onEdit: (id: string) => void
}

// ── Podium Card ──

const POD_STYLES = [
  { border: 'border-gold/40', gradFrom: '#181400', gradTo: '#100d00', text: 'text-gold', label: '1º', medal: '🥇', size: 56 },
  { border: 'border-silver/30', gradFrom: '#121720', gradTo: '#0c1018', text: 'text-silver', label: '2º', medal: '🥈', size: 44 },
  { border: 'border-bronze/30', gradFrom: '#180e05', gradTo: '#100803', text: 'text-bronze', label: '3º', medal: '🥉', size: 44 },
]

function PodCard({ v, style, regras, allVendedores, rankingType }: {
  v: Vendedor | undefined; style: typeof POD_STYLES[0]; regras: Regras; allVendedores: Vendedor[]; rankingType: RankingType
}) {
  if (!v) {
    return (
      <div className={`rounded-xl border ${style.border} p-3 text-center flex flex-col items-center justify-center min-h-[100px]`}
        style={{ background: `linear-gradient(160deg, ${style.gradFrom}, ${style.gradTo})` }}>
        <span className="text-xl">{style.medal}</span>
        <div className="text-muted text-xs italic mt-1">—</div>
      </div>
    )
  }

  const p = pct(v.venda, v.meta)
  const origIdx = allVendedores.findIndex(x => x.id === v.id)
  const value = rankingType === 'venda' ? fmt(v.venda) : rankingType === 'pct' ? fmtPct(p) : `Mk ${Number(v.markup || 0).toFixed(2)}%`

  return (
    <div className={`rounded-xl border ${style.border} p-2.5 sm:p-3 text-center relative overflow-hidden hover:-translate-y-0.5 transition-all`}
      style={{ background: `linear-gradient(160deg, ${style.gradFrom}, ${style.gradTo})` }}>
      <span className="text-xl block mb-1">{style.medal}</span>
      <div className="flex justify-center mb-1">
        <Avatar vendedor={v} size={style.size} idx={origIdx} />
      </div>
      <div className="font-bold text-xs leading-tight truncate px-0.5">{v.nome}</div>
      <div className="text-[0.55rem] text-muted2">{v.filial}</div>
      <div className={`font-display text-sm tracking-wide mt-0.5 ${style.text}`}>{value}</div>
      {rankingType === 'markup' && (
        elegivelMarkup(v, regras)
          ? <div className="text-[0.5rem] bg-green2/15 text-green2 rounded px-1 py-px mt-1 inline-block">✅</div>
          : <div className="text-[0.5rem] bg-red2/10 text-red2 rounded px-1 py-px mt-1 inline-block">⛔</div>
      )}
    </div>
  )
}

// ── Inline Bonus (only for Markup tab) ──

function MarkupBonus({ vendedores, regras }: { vendedores: Vendedor[]; regras: Regras }) {
  const elegiveis = vendedores.filter(v => elegivelMarkup(v, regras))
  // Bônus: melhor markup entre TODOS os elegíveis (inclusive pódio)
  const sortedByMk = sortVendedores(elegiveis, 'markup')
  const bonusVend = sortedByMk.length > 0 ? sortedByMk[0] : null

  if (!bonusVend) {
    return (
      <div className="mt-3 px-3 py-2 bg-gold/5 border border-gold/15 rounded-lg text-xs text-muted2">
        ⭐ Bônus Markup (R$ {Number(regras.bonusMk).toLocaleString('pt-BR')}): Sem elegíveis
      </div>
    )
  }

  return (
    <div className="mt-3 px-3 py-2 bg-gold/5 border border-gold/15 rounded-lg flex items-center gap-2.5 flex-wrap">
      <div className="text-xs">
        <span className="text-gold font-semibold">⭐ Bônus Markup — R$ {Number(regras.bonusMk).toLocaleString('pt-BR')}</span>
        <span className="text-muted2 ml-1.5">Melhor markup entre elegíveis:</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs font-bold text-text">{bonusVend.nome}</span>
        <span className="text-xs bg-green2/10 text-green2 rounded px-1.5 py-px font-bold">Mk {Number(bonusVend.markup).toFixed(2)}%</span>
      </div>
    </div>
  )
}

// ── Main Component ──

export function RankingSection({ type, onEdit }: RankingSectionProps) {
  const allVendedores = useDataStore(s => s.vendedores)
  const regras = useDataStore(s => s.regras)
  const campanhaEncerrada = useDataStore(s => s.campanhaEncerrada)
  const filtered = useFiltered()

  const displayList = useMemo(() => {
    const afterFilter = filterByRanking(filtered, type, regras, campanhaEncerrada)
    return sortVendedores(afterFilter, type)
  }, [filtered, type, regras, campanhaEncerrada])

  // Pódio: para markup, SEMPRE usa só elegíveis (mesmo campanha ativa)
  // Para venda/pct, usa a displayList normal
  const podiumList = useMemo(() => {
    if (type === 'markup') {
      const elegiveis = filtered.filter(v => elegivelMarkup(v, regras))
      return sortVendedores(elegiveis, 'markup')
    }
    return displayList
  }, [filtered, type, regras, displayList])

  const top3 = podiumList.slice(0, 3)
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div>
      {/* Podium + Table grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">

        {/* Podium */}
        <div>
          <div className="grid grid-cols-3 gap-1.5 items-end">
            <div className="pt-3">
              <PodCard v={top3[1]} style={POD_STYLES[1]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
            <div>
              <PodCard v={top3[0]} style={POD_STYLES[0]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
            <div className="pt-5">
              <PodCard v={top3[2]} style={POD_STYLES[2]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
          </div>
          {/* Inline bonus for markup */}
          {type === 'markup' && <MarkupBonus vendedores={filtered} regras={regras} />}
        </div>

        {/* Table */}
        <div>
          {displayList.length === 0 ? (
            <div className="text-center py-8 text-muted2 text-sm italic">
              {campanhaEncerrada ? 'Nenhum vendedor elegível' : 'Nenhum vendedor'}
            </div>
          ) : (
            <div className="space-y-0">
              {displayList.map((v, i) => {
                const p = pct(v.venda, v.meta)
                const mk = v.markup || 0
                const origIdx = allVendedores.findIndex(x => x.id === v.id)
                const bColor = barColor(p)
                const isEleg = type === 'markup' ? elegivelMarkup(v, regras) : true

                const value = type === 'venda' ? fmt(v.venda)
                  : type === 'pct' ? fmtPct(p)
                  : `${Number(mk).toFixed(2)}%`

                return (
                  <div
                    key={v.id}
                    onClick={() => onEdit(v.id)}
                    className="flex items-center gap-2 sm:gap-3 py-1.5 px-2 rounded-lg hover:bg-surface2 cursor-pointer transition-colors animate-row-in"
                    style={{
                      animationDelay: `${i * 0.03}s`,
                      opacity: type === 'markup' && !isEleg && !campanhaEncerrada ? 0.4 : 1,
                    }}
                  >
                    <span className="font-display text-sm w-6 text-center flex-shrink-0">
                      {i < 3 ? MEDALS[i] : <span className="text-muted">{i + 1}°</span>}
                    </span>
                    <Avatar vendedor={v} size={26} idx={origIdx} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate flex items-center gap-1">
                        {v.nome}
                        {type === 'markup' && !isEleg && !campanhaEncerrada && (
                          <span className="text-[0.5rem] bg-red2/10 text-red2 rounded px-1 py-px">⛔</span>
                        )}
                      </div>
                      <div className="text-[0.58rem] text-muted2">{v.filial} · {fmtPct(p)} meta</div>
                    </div>
                    {/* Mini progress */}
                    <div className="hidden sm:block w-16">
                      <div className="bg-surface2 rounded-full h-1 w-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(p, 100)}%`, background: bColor }} />
                      </div>
                    </div>
                    <span className="font-display text-sm tracking-wide text-gold flex-shrink-0 text-right min-w-[55px]">
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
