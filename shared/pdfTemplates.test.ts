import { describe, it, expect } from 'vitest'
import { generatePdfHtml } from './pdfTemplates'
import type { PdfRequest } from './pdfTemplates'

const vendedores = [
  { id: 'v1', codFilial: 17838, filial: 'CUIABA', codVend: 7400, nome: 'ALDEMIR ALVES', meta: 270000, venda: 182862, markup: 51.75 },
  { id: 'v2', codFilial: 17838, filial: 'CUIABA', codVend: 41671, nome: 'JEAN RIOS', meta: 230000, venda: 136093, markup: 52.31 },
  { id: 'v3', codFilial: 27549, filial: 'RONDONOPOLIS', codVend: 15122, nome: 'MARCIO LARA', meta: 270000, venda: 272565, markup: 53.88 },
]

const regras = {
  mkMin: 51,
  metaMin: 85,
  premios: [1500, 1000, 800] as [number, number, number],
  bonusMk: 500,
  bonusFilial: 0.005,
}

const baseReq: PdfRequest = {
  type: 'ranking',
  vendedores,
  regras,
  sortMode: 'pct',
  r2BaseUrl: 'https://fotos.example.com',
}

describe('generatePdfHtml', () => {
  it('generates valid HTML for ranking', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'ranking' })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('DENSUL')
    expect(html).toContain('ALDEMIR ALVES')
    expect(html).toContain('JEAN RIOS')
    expect(html).toContain('MARCIO LARA')
  })

  it('generates podio with medals', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'podio' })
    expect(html).toContain('🥇')
    expect(html).toContain('🥈')
    expect(html).toContain('🥉')
    expect(html).toContain('1º LUGAR')
  })

  it('generates filial-specific PDF', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'filial', filial: 'CUIABA' })
    expect(html).toContain('CUIABA')
    expect(html).toContain('ALDEMIR ALVES')
    expect(html).toContain('JEAN RIOS')
    // Should NOT contain RONDONOPOLIS vendedor
    expect(html).not.toContain('MARCIO LARA')
  })

  it('generates todas filiais with page breaks', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'todas' })
    expect(html).toContain('CUIABA')
    expect(html).toContain('RONDONOPOLIS')
    // Multiple pdf-page divs
    const pageCount = (html.match(/class="pdf-page"/g) || []).length
    expect(pageCount).toBe(2) // CUIABA + RONDONOPOLIS
  })

  it('includes R2 photo URLs', () => {
    const html = generatePdfHtml(baseReq)
    expect(html).toContain('https://fotos.example.com/vendedores/7400.jpg')
  })

  it('includes Google Fonts link', () => {
    const html = generatePdfHtml(baseReq)
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('Bebas+Neue')
    expect(html).toContain('DM+Sans')
  })

  it('sorts by markup when requested', () => {
    const html = generatePdfHtml({ ...baseReq, sortMode: 'markup' })
    // MARCIO has highest markup (53.88), should be first in table
    const marcioPos = html.indexOf('MARCIO LARA')
    const jeanPos = html.indexOf('JEAN RIOS')
    expect(marcioPos).toBeLessThan(jeanPos)
  })

  it('sorts by venda when requested', () => {
    const html = generatePdfHtml({ ...baseReq, sortMode: 'venda' })
    // MARCIO has highest venda (272565), should be first
    const marcioPos = html.indexOf('MARCIO LARA')
    const aldemirPos = html.indexOf('ALDEMIR ALVES')
    expect(marcioPos).toBeLessThan(aldemirPos)
  })

  it('shows elegivel badge for qualifying vendedores', () => {
    const html = generatePdfHtml(baseReq)
    // MARCIO: markup 53.88 > 51, pct 100%+ > 85% → elegível
    expect(html).toContain('Elegível')
  })

  it('handles empty vendedores', () => {
    const html = generatePdfHtml({ ...baseReq, vendedores: [] })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('DENSUL')
  })

  it('campanha ativa: podio inclui todos os vendedores', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'podio', sortMode: 'markup', campanhaEncerrada: false })
    // Todos devem aparecer no pódio (sem filtro de elegibilidade)
    expect(html).toContain('MARCIO LARA')
    expect(html).toContain('ALDEMIR ALVES')
  })

  it('campanha encerrada: podio exibe apenas elegíveis', () => {
    // ALDEMIR: mk 51.75 > 51, pct 67.7% < 85% → inelegível
    // JEAN: mk 52.31 > 51, pct 59.2% < 85% → inelegível
    // MARCIO: mk 53.88 > 51, pct 100%+ >= 85% → elegível
    const html = generatePdfHtml({ ...baseReq, type: 'podio', sortMode: 'markup', campanhaEncerrada: true })
    expect(html).toContain('MARCIO LARA')
    // Inelegíveis não devem aparecer no pódio (mas aparecem na tabela abaixo)
    const podioSection = html.split('RANKING COMPLETO')[0] ?? html
    expect(podioSection).not.toContain('JEAN RIOS')
  })

  it('campanha encerrada: tabela mostra todos com elegíveis primeiro', () => {
    const html = generatePdfHtml({ ...baseReq, type: 'ranking', sortMode: 'markup', campanhaEncerrada: true })
    // MARCIO (elegível) deve aparecer antes de JEAN e ALDEMIR (inelegíveis)
    const marcioPos = html.indexOf('MARCIO LARA')
    const jeanPos = html.indexOf('JEAN RIOS')
    expect(marcioPos).toBeLessThan(jeanPos)
  })
})
