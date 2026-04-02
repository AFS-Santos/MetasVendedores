/**
 * Funções utilitárias compartilhadas entre frontend e worker.
 * FONTE ÚNICA — toda lógica de cálculo e formatação fica aqui.
 */

import type { Vendedor, Regras, SortMode } from './types'

/** Formata valor em R$ */
export const fmt = (v: number): string =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

/** Calcula percentual da meta (2 casas decimais para ranking preciso) */
export const pct = (venda: number, meta: number): number =>
  meta > 0 ? Math.round((venda / meta) * 10000) / 100 : 0

/** Formata percentual para exibição (inteiro sem decimais, fracionário com 2) */
export const fmtPct = (p: number): string =>
  p % 1 === 0 ? `${p}%` : `${p.toFixed(2)}%`

/** Iniciais do nome (2 primeiras palavras) */
export const ini = (nome: string): string =>
  (nome || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()

/** Elegibilidade para ranking de MARKUP: mk > mkMin E % meta >= metaMin */
export const elegivelMarkup = (v: Vendedor, regras: Regras): boolean =>
  (v.markup || 0) > regras.mkMin && pct(v.venda, v.meta) >= regras.metaMin

/** Alias */
export const elegivel = elegivelMarkup

/** Cor da barra de progresso */
export const barColor = (p: number): string =>
  p >= 100 ? '#2ecc71' : p >= 85 ? '#f5c842' : p >= 60 ? '#e67e22' : '#e74c3c'

/** Classe do badge de markup (Tailwind) */
export const mkBadgeClass = (mk: number): string =>
  mk > 51 ? 'bg-green2/10 text-green2' : mk >= 20 ? 'bg-gold/10 text-gold' : 'bg-red2/10 text-red2'

/** Ordena vendedores conforme o modo selecionado */
export const sortVendedores = (arr: Vendedor[], mode: SortMode): Vendedor[] => {
  const copy = [...arr]
  switch (mode) {
    case 'pct':
      return copy.sort((a, b) => pct(b.venda, b.meta) - pct(a.venda, a.meta))
    case 'venda':
      return copy.sort((a, b) => (b.venda || 0) - (a.venda || 0))
    case 'markup':
    default:
      return copy.sort((a, b) => (b.markup || 0) - (a.markup || 0))
  }
}

/**
 * Filtra e ordena vendedores conforme tipo de ranking e estado da campanha.
 *
 * Campanha ATIVA: retorna todos, sem ordenação forçada
 * Campanha ENCERRADA:
 *  - venda/pct: esconde venda = 0
 *  - markup: retorna TODOS, mas ordenados por elegibilidade:
 *      1º elegíveis (mk > mkMin E meta >= metaMin) por markup desc
 *      2º inelegíveis por markup desc
 *    (a tabela exibe todos; o pódio usa apenas os top 3 elegíveis)
 */
export function filterByRanking(
  vendedores: Vendedor[],
  rankingType: 'venda' | 'pct' | 'markup',
  regras: Regras,
  campanhaEncerrada: boolean,
): Vendedor[] {
  if (!campanhaEncerrada) return vendedores
  switch (rankingType) {
    case 'venda':
    case 'pct':
      return vendedores.filter(v => (v.venda || 0) > 0)
    case 'markup': {
      const elegiveis = sortVendedores(
        vendedores.filter(v => elegivelMarkup(v, regras)),
        'markup',
      )
      const inelegiveis = sortVendedores(
        vendedores.filter(v => !elegivelMarkup(v, regras)),
        'markup',
      )
      return [...elegiveis, ...inelegiveis]
    }
  }
}

/** Gera ID único */
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
