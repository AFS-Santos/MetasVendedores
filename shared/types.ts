/**
 * Tipos compartilhados entre frontend e worker.
 * FONTE ÚNICA — qualquer mudança aqui reflete em todos os lugares.
 */

export interface Vendedor {
  id: string
  codFilial: number
  filial: string
  codVend: number
  nome: string
  meta: number
  venda: number
  markup: number
  foto?: string | null
}

export interface Regras {
  mkMin: number
  metaMin: number
  premios: [number, number, number]
  bonusMk: number
  bonusFilial: number
}

export const REGRAS_DEFAULT: Regras = {
  mkMin: 51,
  metaMin: 85,
  premios: [1500, 1000, 800],
  bonusMk: 500,
  bonusFilial: 0.005,
}

/**
 * Tipos de ranking:
 *  'venda'  — sem regra de corte
 *  'pct'    — sem regra de corte
 *  'markup' — elegível: mkMin > 51% E meta >= 85%
 */
export type RankingType = 'venda' | 'pct' | 'markup'

export type SortMode = 'markup' | 'pct' | 'venda'
