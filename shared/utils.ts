/**
 * Funções utilitárias compartilhadas entre frontend e worker.
 * FONTE ÚNICA — toda lógica de cálculo e formatação fica aqui.
 */

import type { Vendedor, Regras, SortMode } from './types'

// ─────────────────────────────────────────────
//  Formatação
// ─────────────────────────────────────────────

/** Formata valor em R$ sem casas decimais */
export const fmt = (v: number): string =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

/** Percentual da meta com 2 casas decimais para ordenação precisa */
export const pct = (venda: number, meta: number): number =>
  meta > 0 ? Math.round((venda / meta) * 10000) / 100 : 0

/** Formata percentual: inteiro sem decimais, fracionário com 2 */
export const fmtPct = (p: number): string =>
  p % 1 === 0 ? `${p}%` : `${p.toFixed(2)}%`

/** Iniciais do nome — primeiras 2 palavras */
export const ini = (nome: string): string =>
  (nome || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()

/** Gera ID único */
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

// ─────────────────────────────────────────────
//  Elegibilidade
// ─────────────────────────────────────────────

/**
 * Vendedor é elegível quando:
 *   markup > mkMin  (estritamente maior, ex: > 51%)
 *   % da meta >= metaMin  (ex: >= 85%)
 */
export const elegivelMarkup = (v: Vendedor, regras: Regras): boolean =>
  (v.markup || 0) > regras.mkMin && pct(v.venda, v.meta) >= regras.metaMin

/** Alias para compatibilidade */
export const elegivel = elegivelMarkup

// ─────────────────────────────────────────────
//  Estilos visuais
// ─────────────────────────────────────────────

/** Cor da barra de progresso baseada no % da meta */
export const barColor = (p: number): string =>
  p >= 100 ? '#2ecc71' : p >= 85 ? '#f5c842' : p >= 60 ? '#e67e22' : '#e74c3c'

/** Classe Tailwind do badge de markup */
export const mkBadgeClass = (mk: number): string =>
  mk > 51 ? 'bg-green2/10 text-green2' : mk >= 20 ? 'bg-gold/10 text-gold' : 'bg-red2/10 text-red2'

// ─────────────────────────────────────────────
//  Ordenação
// ─────────────────────────────────────────────

/** Ordena sem mutar o array original */
export const sortVendedores = (arr: Vendedor[], mode: SortMode): Vendedor[] => {
  const copy = [...arr]
  switch (mode) {
    case 'pct':    return copy.sort((a, b) => pct(b.venda, b.meta) - pct(a.venda, a.meta))
    case 'venda':  return copy.sort((a, b) => (b.venda || 0) - (a.venda || 0))
    case 'markup':
    default:       return copy.sort((a, b) => (b.markup || 0) - (a.markup || 0))
  }
}

// ─────────────────────────────────────────────
//  Fonte única de verdade para todos os rankings
// ─────────────────────────────────────────────

export interface RankingData {
  // Tabelas completas (todos os vendedores, na ordem certa)
  tabelaVenda:  Vendedor[]
  tabelaPct:    Vendedor[]
  tabelaMarkup: Vendedor[]

  // Pódios — top 3 para exibição
  podiumVenda:  [Vendedor?, Vendedor?, Vendedor?]
  podiumPct:    [Vendedor?, Vendedor?, Vendedor?]
  podiumMarkup: [Vendedor?, Vendedor?, Vendedor?]

  // Bônus markup
  bonusMarkupVend: Vendedor | null   // melhor mk elegível (qualquer posição)
  bonusMarkupFora: Vendedor[]        // 4º/5º/6º elegíveis fora do pódio markup

  // Elegíveis ordenados por ranking (para PDF encerramento)
  elegiveisMarkup: Vendedor[]
  elegiveisVenda:  Vendedor[]
  elegiveisPct:    Vendedor[]
}

/**
 * FUNÇÃO CENTRAL — calcula tudo de uma vez só.
 * Dashboard e PDF consomem esta função. Resultado garantidamente idêntico.
 *
 * Regras de pódio:
 *   Campanha ATIVA:
 *     - venda/pct → top 3 de todos por valor/pct desc
 *     - markup    → top 3 de TODOS por markup desc (sem filtro de elegibilidade)
 *
 *   Campanha ENCERRADA:
 *     - venda/pct → top 3 de quem tem venda > 0, por valor/pct desc
 *     - markup    → top 3 SOMENTE entre elegíveis, por markup desc
 *
 * Regras de tabela:
 *   - venda/pct: ordenação simples, encerrado oculta venda = 0
 *   - markup: elegíveis primeiro (mk desc), depois inelegíveis (mk desc)
 */
export function prepareRankingData(
  vendedores: Vendedor[],
  regras: Regras,
  campanhaEncerrada: boolean,
): RankingData {

  const elegiveis   = vendedores.filter(v => elegivelMarkup(v, regras))
  const inelegiveis = vendedores.filter(v => !elegivelMarkup(v, regras))

  // Base para venda/pct — encerrado oculta quem não vendeu nada
  const baseVendaPct = campanhaEncerrada
    ? vendedores.filter(v => (v.venda || 0) > 0)
    : vendedores

  // ── Tabelas ──
  const tabelaVenda  = sortVendedores(baseVendaPct, 'venda')
  const tabelaPct    = sortVendedores(baseVendaPct, 'pct')
  const tabelaMarkup = [
    ...sortVendedores(elegiveis,   'markup'),
    ...sortVendedores(inelegiveis, 'markup'),
  ]

  // ── Pódios ──
  const podiumVenda = tabelaVenda.slice(0, 3) as [Vendedor?, Vendedor?, Vendedor?]
  const podiumPct   = tabelaPct.slice(0, 3)   as [Vendedor?, Vendedor?, Vendedor?]

  const podiumMarkupSource = campanhaEncerrada
    ? sortVendedores(elegiveis,   'markup')
    : sortVendedores(vendedores,  'markup')
  const podiumMarkup = podiumMarkupSource.slice(0, 3) as [Vendedor?, Vendedor?, Vendedor?]

  // ── Bônus markup ──
  const elegiveisMarkup = sortVendedores(elegiveis, 'markup')
  const bonusMarkupVend = elegiveisMarkup[0] ?? null

  const podiumMarkupIds = new Set(podiumMarkup.map(v => v?.id))
  const bonusMarkupFora = elegiveisMarkup
    .filter(v => !podiumMarkupIds.has(v.id))
    .slice(0, 3)

  // ── Elegíveis por ranking (encerramento) ──
  const elegiveisVenda = sortVendedores(elegiveis, 'venda')
  const elegiveisPct   = sortVendedores(elegiveis, 'pct')

  return {
    tabelaVenda,
    tabelaPct,
    tabelaMarkup,
    podiumVenda,
    podiumPct,
    podiumMarkup,
    bonusMarkupVend,
    bonusMarkupFora,
    elegiveisMarkup,
    elegiveisVenda,
    elegiveisPct,
  }
}

// Mantido para compatibilidade com código legado (sheetsApi, stores)
export function filterByRanking(
  vendedores: Vendedor[],
  rankingType: 'venda' | 'pct' | 'markup',
  regras: Regras,
  campanhaEncerrada: boolean,
): Vendedor[] {
  const data = prepareRankingData(vendedores, regras, campanhaEncerrada)
  switch (rankingType) {
    case 'venda':  return data.tabelaVenda
    case 'pct':    return data.tabelaPct
    case 'markup': return data.tabelaMarkup
  }
}
