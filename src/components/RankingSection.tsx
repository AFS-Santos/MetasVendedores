import { useMemo } from 'react'
import type React from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useFiltered } from '../hooks/useFiltered'
import { fmt, pct, fmtPct, elegivelMarkup, barColor, prepareRankingData } from '../lib/formatters'
import { Avatar } from './Avatar'
import type { RankingType } from '../schemas/vendedor'
import type { Vendedor, Regras } from '../schemas/vendedor'

interface RankingSectionProps {
  type: RankingType
  onEdit: (id: string) => void
}

// ── Estilos do pódio ──

const POD_STYLES = [
  { border: 'border-gold/40',   gradFrom: '#181400', gradTo: '#100d00', text: 'text-gold',   medal: '🥇', size: 56 },
  { border: 'border-silver/30', gradFrom: '#121720', gradTo: '#0c1018', text: 'text-silver', medal: '🥈', size: 44 },
  { border: 'border-bronze/30', gradFrom: '#180e05', gradTo: '#100803', text: 'text-bronze', medal: '🥉', size: 44 },
]

// ── Card do pódio ──

function PodCard({ v, style, regras, allVendedores, rankingType }: {
  v: Vendedor | undefined
  style: typeof POD_STYLES[0]
  regras: Regras
  allVendedores: Vendedor[]
  rankingType: RankingType
}) {
  if (!v) {
    return (
      <div
        className={`rounded-xl border ${style.border} p-3 text-center flex flex-col items-center justify-center min-h-[100px]`}
        style={{ background: `linear-gradient(160deg, ${style.gradFrom}, ${style.gradTo})` }}
      >
        <span className="text-xl">{style.medal}</span>
        <div className="text-muted text-xs italic mt-1">—</div>
      </div>
    )
  }

  const p      = pct(v.venda, v.meta)
  const origIdx = allVendedores.findIndex(x => x.id === v.id)
  const isEleg  = elegivelMarkup(v, regras)

  const value = rankingType === 'venda'
    ? fmt(v.venda)
    : rankingType === 'pct'
    ? fmtPct(p)
    : `Mk ${Number(v.markup || 0).toFixed(2)}%`

  return (
    <div
      className={`rounded-xl border ${style.border} p-2.5 sm:p-3 text-center relative overflow-hidden hover:-translate-y-0.5 transition-all`}
      style={{ background: `linear-gradient(160deg, ${style.gradFrom}, ${style.gradTo})` }}
    >
      <span className="text-xl block mb-1">{style.medal}</span>
      <div className="flex justify-center mb-1">
        <Avatar vendedor={v} size={style.size} idx={origIdx} />
      </div>
      <div className="font-bold text-xs leading-tight truncate px-0.5">{v.nome}</div>
      <div className="text-[0.55rem] text-muted2">{v.filial}</div>
      <div className={`font-display text-sm tracking-wide mt-0.5 ${style.text}`}>{value}</div>
      {rankingType === 'markup' && (
        isEleg
          ? <div className="text-[0.5rem] bg-green2/15 text-green2 rounded px-1 py-px mt-1 inline-block">✅</div>
          : <div className="text-[0.5rem] bg-red2/10  text-red2  rounded px-1 py-px mt-1 inline-block">⛔</div>
      )}
    </div>
  )
}

// ── Card de bônus markup ──

function MarkupBonusCard({ vend, regras }: { vend: Vendedor | null; regras: Regras }) {
  if (!vend) {
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
        <span className="text-xs font-bold text-text">{vend.nome}</span>
        <span className="text-xs bg-green2/10 text-green2 rounded px-1.5 py-px font-bold">
          Mk {Number(vend.markup).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

// ── Componente principal ──

export function RankingSection({ type, onEdit }: RankingSectionProps) {
  const allVendedores    = useDataStore(s => s.vendedores)
  const regras           = useDataStore(s => s.regras)
  const campanhaEncerrada = useDataStore(s => s.campanhaEncerrada)
  const filtered         = useFiltered()

  /**
   * Único ponto de cálculo — tudo vem daqui.
   * Muda o filtro de filial (filtered) ou o estado da campanha → recalcula tudo.
   */
  const ranking = useMemo(
    () => prepareRankingData(filtered, regras, campanhaEncerrada),
    [filtered, regras, campanhaEncerrada],
  )

  // Seleciona tabela e pódio corretos para a aba ativa
  const tabela  = type === 'venda' ? ranking.tabelaVenda
                : type === 'pct'   ? ranking.tabelaPct
                :                    ranking.tabelaMarkup

  const podium  = type === 'venda' ? ranking.podiumVenda
                : type === 'pct'   ? ranking.podiumPct
                :                    ranking.podiumMarkup

  // IDs do pódio — para marcar os badges 🏆 Top 3 na tabela
  const podiumIds = new Set(podium.map(v => v?.id))

  // ID do vencedor do bônus — para marcar o badge ⭐ na tabela
  const bonusId = ranking.bonusMarkupVend?.id ?? null

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">

        {/* ── Pódio ── */}
        <div>
          <div className="grid grid-cols-3 gap-1.5 items-end">
            <div className="pt-3">
              <PodCard v={podium[1]} style={POD_STYLES[1]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
            <div>
              <PodCard v={podium[0]} style={POD_STYLES[0]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
            <div className="pt-5">
              <PodCard v={podium[2]} style={POD_STYLES[2]!} regras={regras} allVendedores={allVendedores} rankingType={type} />
            </div>
          </div>

          {type === 'markup' && (
            <MarkupBonusCard vend={ranking.bonusMarkupVend} regras={regras} />
          )}
        </div>

        {/* ── Tabela ── */}
        <div className="overflow-x-auto">
          {tabela.length === 0 ? (
            <div className="text-center py-8 text-muted2 text-sm italic">
              Nenhum vendedor
            </div>
          ) : (
            <table className="w-full border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 px-1 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left w-8">#</th>
                  <th className="pb-2 px-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left">Vendedor</th>
                  <th className="pb-2 px-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left hidden md:table-cell">Filial</th>
                  <th className="pb-2 px-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left hidden sm:table-cell">Progresso</th>
                  <th className="pb-2 px-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-center hidden lg:table-cell">Markup</th>
                  <th className="pb-2 px-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase text-muted2 text-right">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((v, i) => {
                  const p       = pct(v.venda, v.meta)
                  const mk      = v.markup || 0
                  const origIdx = allVendedores.findIndex(x => x.id === v.id)
                  const bColor  = barColor(p)
                  const isEleg  = elegivelMarkup(v, regras)
                  const isPodium  = podiumIds.has(v.id)
                  const isBonus   = bonusId === v.id
                  const opacity   = type === 'markup' && !isEleg && !campanhaEncerrada ? 0.38 : 1

                  // Badge abaixo do nome
                  let badge: React.ReactNode = null
                  if (type === 'markup') {
                    if (isPodium) {
                      badge = (
                        <span className="inline-flex items-center gap-0.5 text-[0.52rem] bg-gold/15 text-gold border border-gold/25 rounded px-1.5 py-px font-bold">
                          🏆 Top 3
                        </span>
                      )
                    } else if (isBonus) {
                      badge = (
                        <span className="inline-flex items-center gap-0.5 text-[0.52rem] bg-gold/10 text-gold border border-gold/20 rounded px-1.5 py-px font-bold">
                          ⭐ Bônus R$ {Number(regras.bonusMk).toLocaleString('pt-BR')}
                        </span>
                      )
                    } else if (isEleg) {
                      badge = (
                        <span className="inline-flex items-center gap-0.5 text-[0.52rem] bg-green2/10 text-green2 border border-green2/20 rounded px-1.5 py-px font-bold">
                          ✅ Elegível
                        </span>
                      )
                    } else if (!campanhaEncerrada) {
                      badge = (
                        <span className="inline-flex items-center gap-0.5 text-[0.52rem] bg-red2/10 text-red2 border border-red2/20 rounded px-1.5 py-px font-bold">
                          ⛔ Inelegível
                        </span>
                      )
                    }
                  }

                  const mkBg = mk > regras.mkMin
                    ? 'bg-green2/10 text-green2'
                    : mk >= 20
                    ? 'bg-gold/10 text-gold'
                    : 'bg-red2/10 text-red2'

                  return (
                    <tr
                      key={v.id}
                      onClick={() => onEdit(v.id)}
                      className="border-b border-border/40 hover:bg-surface2 cursor-pointer transition-colors animate-row-in"
                      style={{ animationDelay: `${i * 0.025}s`, opacity }}
                    >
                      {/* # */}
                      <td className="py-2 px-1 w-8">
                        <span className="font-display text-sm text-center block">
                          {i < 3
                            ? (['🥇', '🥈', '🥉'] as const)[i]
                            : <span className="text-muted text-xs">{i + 1}°</span>
                          }
                        </span>
                      </td>

                      {/* Vendedor + badge */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar vendedor={v} size={28} idx={origIdx} />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-text truncate leading-tight">{v.nome}</div>
                            <div className="text-[0.55rem] text-muted2 leading-tight md:hidden">{v.filial}</div>
                            {badge && <div className="mt-0.5">{badge}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Filial */}
                      <td className="py-2 px-2 hidden md:table-cell">
                        <span className="text-[0.65rem] px-2 py-0.5 rounded bg-surface3 text-muted2 whitespace-nowrap">
                          {v.filial}
                        </span>
                      </td>

                      {/* Progresso */}
                      <td className="py-2 px-2 hidden sm:table-cell min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-surface3 rounded-full h-1.5 overflow-hidden min-w-[60px]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(p, 100)}%`, background: bColor }}
                            />
                          </div>
                          <span className="text-[0.62rem] font-bold whitespace-nowrap" style={{ color: bColor }}>
                            {fmtPct(p)}
                          </span>
                        </div>
                        <div className="text-[0.55rem] text-muted2 mt-0.5 whitespace-nowrap">
                          {fmt(v.venda)} / {fmt(v.meta)}
                        </div>
                      </td>

                      {/* Markup */}
                      <td className="py-2 px-2 hidden lg:table-cell text-center">
                        <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${mkBg}`}>
                          +{Number(mk).toFixed(2)}%
                        </span>
                      </td>

                      {/* Vendido */}
                      <td className="py-2 px-2 text-right">
                        <span className="font-display text-sm tracking-wide text-gold whitespace-nowrap">
                          {fmt(v.venda)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
