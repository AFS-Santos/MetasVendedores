import { describe, it, expect } from 'vitest'
import { fmt, pct, fmtPct, ini, elegivel, elegivelMarkup, filterByRanking, barColor, mkBadgeClass, sortVendedores, uid } from './formatters'
import type { Vendedor, Regras } from '../schemas/vendedor'

// ── fmt() ──
describe('fmt', () => {
  it('formats zero', () => {
    expect(fmt(0)).toBe('R$ 0')
  })

  it('formats thousands', () => {
    expect(fmt(270000)).toContain('270')
  })

  it('handles null/undefined gracefully', () => {
    expect(fmt(null as unknown as number)).toBe('R$ 0')
    expect(fmt(undefined as unknown as number)).toBe('R$ 0')
  })
})

// ── pct() ──
describe('pct', () => {
  it('calculates percentage correctly', () => {
    expect(pct(135000, 270000)).toBe(50)
  })

  it('returns 0 when meta is 0', () => {
    expect(pct(100, 0)).toBe(0)
  })

  it('returns 2 decimal places', () => {
    expect(pct(1, 3)).toBe(33.33) // 33.333... → 33.33
  })

  it('handles over 100%', () => {
    expect(pct(300000, 270000)).toBe(111.11)
  })

  it('differentiates close values (the bug fix)', () => {
    // Two vendors with same 230k meta but different sales
    const a = pct(198254, 230000) // 86.20%
    const b = pct(197256, 230000) // 85.76%
    expect(a).toBeGreaterThan(b)
    expect(a).not.toBe(b) // must NOT be equal
  })
})

// ── fmtPct() ──
describe('fmtPct', () => {
  it('shows integer without decimals', () => {
    expect(fmtPct(50)).toBe('50%')
    expect(fmtPct(100)).toBe('100%')
  })

  it('shows 2 decimals when fractional', () => {
    expect(fmtPct(86.20)).toBe('86.20%')
    expect(fmtPct(85.76)).toBe('85.76%')
  })
})

// ── ini() ──
describe('ini', () => {
  it('returns first two initials', () => {
    expect(ini('ALDEMIR ALVES')).toBe('AA')
  })

  it('handles single name', () => {
    expect(ini('MARCIO')).toBe('M')
  })

  it('handles three+ names (takes first two)', () => {
    expect(ini('FABRICIO CAMPAGNONI SILVA')).toBe('FC')
  })

  it('handles empty string', () => {
    expect(ini('')).toBe('?')
  })
})

// ── elegivel() ──
describe('elegivel', () => {
  const regras: Regras = {
    mkMin: 51,
    metaMin: 85,
    premios: [1500, 1000, 800],
    bonusMk: 500,
    bonusFilial: 0.005,
  }

  const makeVendedor = (markup: number, venda: number, meta: number): Vendedor => ({
    id: 'v1', codFilial: 1, filial: 'TEST', codVend: 1, nome: 'TEST',
    meta, venda, markup, foto: null,
  })

  it('returns true when markup > mkMin AND pct >= metaMin', () => {
    // markup 55 > 51, pct = 90% >= 85%
    expect(elegivel(makeVendedor(55, 90000, 100000), regras)).toBe(true)
  })

  it('returns false when markup <= mkMin', () => {
    // markup 51 is NOT > 51 (must be strictly greater)
    expect(elegivel(makeVendedor(51, 90000, 100000), regras)).toBe(false)
  })

  it('returns false when pct < metaMin', () => {
    // markup 55 > 51 but pct = 50% < 85%
    expect(elegivel(makeVendedor(55, 50000, 100000), regras)).toBe(false)
  })

  it('returns false when both conditions fail', () => {
    expect(elegivel(makeVendedor(30, 10000, 100000), regras)).toBe(false)
  })

  it('returns true at exact metaMin boundary', () => {
    // pct = 85% >= 85%
    expect(elegivel(makeVendedor(52, 85000, 100000), regras)).toBe(true)
  })
})

// ── barColor() ──
describe('barColor', () => {
  it('green for >= 100%', () => {
    expect(barColor(100)).toBe('#2ecc71')
    expect(barColor(120)).toBe('#2ecc71')
  })

  it('gold for >= 85%', () => {
    expect(barColor(85)).toBe('#f5c842')
    expect(barColor(99)).toBe('#f5c842')
  })

  it('orange for >= 60%', () => {
    expect(barColor(60)).toBe('#e67e22')
  })

  it('red for < 60%', () => {
    expect(barColor(59)).toBe('#e74c3c')
    expect(barColor(0)).toBe('#e74c3c')
  })
})

// ── mkBadgeClass() ──
describe('mkBadgeClass', () => {
  it('green for > 51', () => {
    expect(mkBadgeClass(52)).toContain('green2')
  })

  it('gold for >= 20', () => {
    expect(mkBadgeClass(20)).toContain('gold')
    expect(mkBadgeClass(50)).toContain('gold')
  })

  it('red for < 20', () => {
    expect(mkBadgeClass(19)).toContain('red2')
  })
})

// ── sortVendedores() ──
describe('sortVendedores', () => {
  const vendedores: Vendedor[] = [
    { id: 'a', codFilial: 1, filial: 'A', codVend: 1, nome: 'LOW', meta: 100000, venda: 50000, markup: 30, foto: null },
    { id: 'b', codFilial: 1, filial: 'A', codVend: 2, nome: 'HIGH', meta: 100000, venda: 90000, markup: 60, foto: null },
    { id: 'c', codFilial: 1, filial: 'A', codVend: 3, nome: 'MID', meta: 100000, venda: 70000, markup: 45, foto: null },
  ]

  it('sorts by markup descending', () => {
    const result = sortVendedores(vendedores, 'markup')
    expect(result[0]!.nome).toBe('HIGH')
    expect(result[2]!.nome).toBe('LOW')
  })

  it('sorts by pct descending', () => {
    const result = sortVendedores(vendedores, 'pct')
    expect(result[0]!.nome).toBe('HIGH') // 90%
    expect(result[2]!.nome).toBe('LOW')  // 50%
  })

  it('sorts by venda descending', () => {
    const result = sortVendedores(vendedores, 'venda')
    expect(result[0]!.venda).toBe(90000)
    expect(result[2]!.venda).toBe(50000)
  })

  it('does not mutate original array', () => {
    const original = [...vendedores]
    sortVendedores(vendedores, 'markup')
    expect(vendedores[0]!.id).toBe(original[0]!.id)
  })
})

// ── uid() ──
describe('uid', () => {
  it('generates unique ids', () => {
    const a = uid()
    const b = uid()
    expect(a).not.toBe(b)
  })

  it('returns a string', () => {
    expect(typeof uid()).toBe('string')
  })
})

// ── filterByRanking() ──
describe('filterByRanking', () => {
  const regras: Regras = {
    mkMin: 51, metaMin: 85,
    premios: [1500, 1000, 800], bonusMk: 500, bonusFilial: 0.005,
  }

  const vendedores: Vendedor[] = [
    { id: 'a', codFilial: 1, filial: 'A', codVend: 1, nome: 'HAS_SALES', meta: 100000, venda: 90000, markup: 55, foto: null },
    { id: 'b', codFilial: 1, filial: 'A', codVend: 2, nome: 'ZERO_SALES', meta: 100000, venda: 0, markup: 0, foto: null },
    { id: 'c', codFilial: 1, filial: 'A', codVend: 3, nome: 'LOW_META', meta: 100000, venda: 50000, markup: 55, foto: null },
  ]

  it('campanha ativa: venda returns all', () => {
    const result = filterByRanking(vendedores, 'venda', regras, false)
    expect(result).toHaveLength(3)
  })

  it('campanha ativa: markup returns all', () => {
    const result = filterByRanking(vendedores, 'markup', regras, false)
    expect(result).toHaveLength(3)
  })

  it('campanha encerrada: venda hides venda = 0', () => {
    const result = filterByRanking(vendedores, 'venda', regras, true)
    expect(result).toHaveLength(2)
    expect(result.find(v => v.nome === 'ZERO_SALES')).toBeUndefined()
  })

  it('campanha encerrada: pct hides venda = 0', () => {
    const result = filterByRanking(vendedores, 'pct', regras, true)
    expect(result).toHaveLength(2)
  })

  it('campanha encerrada: markup only shows eligible (mk > 51 AND meta >= 85%)', () => {
    const result = filterByRanking(vendedores, 'markup', regras, true)
    // Only HAS_SALES: mk 55 > 51, pct 90% >= 85%
    // ZERO_SALES: mk 0, pct 0% → out
    // LOW_META: mk 55 > 51, but pct 50% < 85% → out
    expect(result).toHaveLength(1)
    expect(result[0]!.nome).toBe('HAS_SALES')
  })
})
