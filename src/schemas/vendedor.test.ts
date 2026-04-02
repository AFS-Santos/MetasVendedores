import { describe, it, expect } from 'vitest'
import { VendedorSchema, RegrasSchema, SheetsResponseSchema, REGRAS_DEFAULT } from './vendedor'

describe('VendedorSchema', () => {
  it('parses valid vendedor', () => {
    const result = VendedorSchema.parse({
      id: 'v1',
      codFilial: 17838,
      filial: 'CUIABA',
      codVend: 7400,
      nome: 'ALDEMIR ALVES',
      meta: 270000,
      venda: 182862,
      markup: 51.75,
      foto: null,
    })
    expect(result.nome).toBe('ALDEMIR ALVES')
    expect(result.markup).toBe(51.75)
  })

  it('applies defaults for missing optional fields', () => {
    const result = VendedorSchema.parse({
      id: 'v1',
      nome: 'TEST',
    })
    expect(result.meta).toBe(0)
    expect(result.venda).toBe(0)
    expect(result.markup).toBe(0)
    expect(result.foto).toBeNull()
    expect(result.codFilial).toBe(0)
  })

  it('rejects empty nome', () => {
    expect(() => VendedorSchema.parse({ id: 'v1', nome: '' })).toThrow()
  })
})

describe('RegrasSchema', () => {
  it('parses valid regras', () => {
    const result = RegrasSchema.parse({
      mkMin: 51,
      metaMin: 85,
      premios: [1500, 1000, 800],
      bonusMk: 500,
      bonusFilial: 0.005,
    })
    expect(result.premios).toEqual([1500, 1000, 800])
  })

  it('applies defaults', () => {
    const result = RegrasSchema.parse({})
    expect(result.mkMin).toBe(51)
    expect(result.metaMin).toBe(85)
  })
})

describe('SheetsResponseSchema', () => {
  it('parses valid response with vendedores array', () => {
    const result = SheetsResponseSchema.parse({
      vendedores: [
        { id: 'gs0', nome: 'TEST', codVend: 1, codFilial: 1, filial: 'A', meta: 100, venda: 50, markup: 0.5 },
      ],
    })
    expect(result.vendedores).toHaveLength(1)
  })

  it('rejects response without vendedores', () => {
    expect(() => SheetsResponseSchema.parse({})).toThrow()
  })

  it('rejects non-array vendedores', () => {
    expect(() => SheetsResponseSchema.parse({ vendedores: 'not an array' })).toThrow()
  })
})

describe('REGRAS_DEFAULT', () => {
  it('has expected default values', () => {
    expect(REGRAS_DEFAULT.mkMin).toBe(51)
    expect(REGRAS_DEFAULT.metaMin).toBe(85)
    expect(REGRAS_DEFAULT.premios).toEqual([1500, 1000, 800])
    expect(REGRAS_DEFAULT.bonusMk).toBe(500)
    expect(REGRAS_DEFAULT.bonusFilial).toBe(0.005)
  })
})
