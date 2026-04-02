/**
 * Zod schemas para validação de dados.
 * Os TIPOS vêm de shared/types (fonte única).
 * Os SCHEMAS (validação Zod) são específicos do frontend.
 */

import { z } from 'zod'

// Re-export types from shared
export type { Vendedor, Regras, RankingType, SortMode } from '@shared/types'
export { REGRAS_DEFAULT } from '@shared/types'

export const VendedorSchema = z.object({
  id: z.string(),
  codFilial: z.number().default(0),
  filial: z.string().default(''),
  codVend: z.number().default(0),
  nome: z.string().min(1),
  meta: z.number().default(0),
  venda: z.number().default(0),
  markup: z.number().default(0),
  foto: z.string().nullable().default(null),
})

export const SheetsResponseSchema = z.object({
  vendedores: z.array(VendedorSchema),
})

export const FotosResponseSchema = z.object({
  fotos: z.record(z.string(), z.string()),
})

export const RegrasSchema = z.object({
  mkMin: z.number().default(51),
  metaMin: z.number().default(85),
  premios: z.tuple([z.number(), z.number(), z.number()]).default([1500, 1000, 800]),
  bonusMk: z.number().default(500),
  bonusFilial: z.number().default(0.005),
})
