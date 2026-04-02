/**
 * Templates HTML para geração de PDF/PNG.
 *
 * IMPORTANTE: este arquivo NÃO calcula rankings.
 * Todos os dados já chegam prontos via prepareRankingData (shared/utils.ts).
 * Isso garante que dashboard e PDF usem exatamente os mesmos resultados.
 */

import type { Vendedor, Regras, SortMode } from './types'
import { fmt, pct, fmtPct, ini, elegivel, prepareRankingData } from './utils'

export interface PdfRequest {
  type: 'ranking' | 'podio' | 'filial' | 'todas' | 'encerramento'
  vendedores: Vendedor[]
  regras: Regras
  sortMode: SortMode
  filial?: string
  r2BaseUrl: string
  campanhaEncerrada?: boolean
}

// ─────────────────────────────────────────────
//  Helpers de foto e avatar
// ─────────────────────────────────────────────

function fotoUrl(v: Vendedor, r2Base: string): string | null {
  if (v.foto) return v.foto
  if (!r2Base) return null
  return `${r2Base}/vendedores/${v.codVend}.jpg`
}

function avatarHtml(v: Vendedor, size: number, r2Base: string): string {
  const colors  = ['#e3f0ff', '#fff3e0', '#e8f5e9', '#fce4ec', '#f3e5f5', '#e0f7fa', '#fff9c4', '#fbe9e7']
  const tcolors = ['#1565c0', '#e65100', '#1b5e20', '#880e4f', '#4a148c', '#006064', '#f57f17', '#bf360c']
  const idx      = (v.nome || '').charCodeAt(0) % 8
  const initials = ini(v.nome)
  const url      = fotoUrl(v, r2Base)

  const css = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${colors[idx]};color:${tcolors[idx]};font-weight:700;font-size:${size * 0.32}px;font-family:'DM Sans',sans-serif;flex-shrink:0;margin-right:8px`

  if (url) {
    return `<span style="${css}"><img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none';this.parentElement.textContent='${initials}'"></span>`
  }
  return `<span style="${css}">${initials}</span>`
}

// ─────────────────────────────────────────────
//  Badges
// ─────────────────────────────────────────────

function badgeMk(mk: number): string {
  const bg  = mk > 51 ? '#dcfce7' : mk >= 20 ? '#fef9c3' : '#fee2e2'
  const cor = mk > 51 ? '#15803d' : mk >= 20 ? '#92400e' : '#b91c1c'
  return `<span style="background:${bg};color:${cor};border-radius:20px;padding:2px 8px;font-size:0.72rem;font-weight:700">${mk > 0 ? '+' : ''}${Number(mk).toFixed(2)}%</span>`
}

function badgePct(p: number): string {
  const bg  = p >= 100 ? '#dcfce7' : p >= 85 ? '#fef9c3' : p >= 60 ? '#fff7ed' : '#fee2e2'
  const cor = p >= 100 ? '#15803d' : p >= 85 ? '#92400e' : p >= 60 ? '#c2410c' : '#b91c1c'
  return `<span style="background:${bg};color:${cor};border-radius:20px;padding:2px 8px;font-size:0.72rem;font-weight:700">${fmtPct(p)}</span>`
}

function statusBadge(v: Vendedor, regras: Regras): string {
  return elegivel(v, regras)
    ? '<span style="background:#dcfce7;color:#15803d;border-radius:4px;padding:1px 6px;font-size:0.62rem;font-weight:700">✅ Elegível</span>'
    : '<span style="background:#fee2e2;color:#b91c1c;border-radius:4px;padding:1px 6px;font-size:0.62rem;font-weight:700">⛔ Não elegível</span>'
}

// ─────────────────────────────────────────────
//  Seções comuns
// ─────────────────────────────────────────────

function headerSection(subtitulo: string, filial?: string): string {
  return `<div style="border-bottom:2px solid #f5c842;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:2px;color:#13161d">⚡ <span style="color:#e0a800">DENSUL</span> MT/MS</div>
      <div style="font-size:0.7rem;color:#888;letter-spacing:1px;text-transform:uppercase">${subtitulo}</div>
    </div>
    ${filial ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:#13161d;letter-spacing:2px">${filial}</div>` : ''}
  </div>`
}

function kpiBar(lista: Vendedor[]): string {
  const totalV = lista.reduce((s, v) => s + (v.venda || 0), 0)
  const totalM = lista.reduce((s, v) => s + (v.meta  || 0), 0)
  const pctG   = totalM > 0 ? Math.round(totalV / totalM * 100) : 0
  const corP   = pctG >= 100 ? '#15803d' : pctG >= 60 ? '#92400e' : '#b91c1c'
  const mks    = lista.filter(v => v.markup > 0).map(v => v.markup)
  const mkMed  = mks.length ? (mks.reduce((a, b) => a + b, 0) / mks.length).toFixed(2) + '%' : '—'

  const kpi = (l: string, val: string, c: string) =>
    `<div style="background:#f7f8fc;border-left:3px solid #f5c842;border-radius:8px;padding:10px 14px">
      <div style="font-size:0.58rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:3px">${l}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:${c}">${val}</div>
    </div>`

  return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
    ${kpi('Meta Geral', Math.round(pctG) + '%', corP)}
    ${kpi('Markup Médio', mkMed, '#c8860a')}
    ${kpi('Vendedores', String(lista.length), '#1a56a0')}
  </div>`
}

function secTitle(txt: string): string {
  return `<div style="background:#13161d;color:#fff;padding:8px 14px;border-radius:6px;font-family:'Bebas Neue',sans-serif;font-size:0.9rem;letter-spacing:2px;margin-bottom:14px">${txt}</div>`
}

// ─────────────────────────────────────────────
//  Tabela — recebe lista já ordenada
// ─────────────────────────────────────────────

function tabela(lista: Vendedor[], regras: Regras, r2Base: string, mostrarFilial: boolean): string {
  const MEDALS = ['🥇', '🥈', '🥉']
  const th = 'padding:7px 8px;text-align:left;font-size:0.62rem;letter-spacing:1px;text-transform:uppercase;color:#fff;background:#13161d'

  const linhas = lista.map((v, i) => {
    const p      = pct(v.venda, v.meta)
    const bg     = i % 2 === 0 ? '#ffffff' : '#f9fafb'
    const isEleg = elegivel(v, regras)

    return `<tr style="background:${bg};page-break-inside:avoid;opacity:${isEleg ? 1 : 0.75}">
      <td style="padding:7px 8px;width:28px;text-align:center;font-size:0.9rem">${i < 3 ? MEDALS[i] : (i + 1) + '°'}</td>
      <td style="padding:7px 8px"><div style="display:flex;align-items:center">${avatarHtml(v, 28, r2Base)}<div>
        <div style="font-weight:700;font-size:0.8rem">${v.nome}</div>
        <div style="font-size:0.62rem;color:#888">Cód ${v.codVend}</div>
      </div></div></td>
      ${mostrarFilial ? `<td style="padding:7px 8px"><span style="background:#f0f2f5;padding:2px 6px;border-radius:4px;font-size:0.68rem">${v.filial}</span></td>` : ''}
      <td style="padding:7px 8px;text-align:center">${badgePct(p)}</td>
      <td style="padding:7px 8px;text-align:center">${badgeMk(v.markup)}</td>
      <td style="padding:7px 8px;text-align:center">${statusBadge(v, regras)}</td>
      <td style="padding:7px 8px;text-align:right;font-family:'Bebas Neue',sans-serif;font-size:0.95rem;color:#13161d;white-space:nowrap">${fmt(v.venda)}</td>
    </tr>`
  }).join('')

  return `<table style="width:100%;border-collapse:collapse;font-size:0.8rem;margin-bottom:20px">
    <thead><tr>
      <th style="${th};width:28px">#</th>
      <th style="${th}">Vendedor</th>
      ${mostrarFilial ? `<th style="${th}">Filial</th>` : ''}
      <th style="${th};text-align:center">% Meta</th>
      <th style="${th};text-align:center">Markup</th>
      <th style="${th};text-align:center">Status</th>
      <th style="${th};text-align:right">Valor Vendido</th>
    </tr></thead>
    <tbody>${linhas}</tbody>
  </table>`
}

// ─────────────────────────────────────────────
//  Pódio — recebe lista já ordenada e fatiada
// ─────────────────────────────────────────────

function podio3(
  top3: [Vendedor?, Vendedor?, Vendedor?],
  regras: Regras,
  r2Base: string,
  showPremio: boolean,
): string {
  const cfg = [
    { pos: 0, medal: '🥇', label: '1º LUGAR', bg: 'linear-gradient(160deg,#fffbea,#fff3b0)', brd: '#f5c842', cor: '#c8860a', avBg: '#fffbea', avCor: '#c8860a', h: '220px' },
    { pos: 1, medal: '🥈', label: '2º LUGAR', bg: 'linear-gradient(160deg,#f0f2f5,#e4e9f0)', brd: '#c0c8d8', cor: '#4a5568', avBg: '#f0f2f5', avCor: '#4a5568', h: '190px' },
    { pos: 2, medal: '🥉', label: '3º LUGAR', bg: 'linear-gradient(160deg,#fdf3e8,#fae5c8)', brd: '#cd7f32', cor: '#8b5e1a', avBg: '#fdf3e8', avCor: '#8b5e1a', h: '170px' },
  ]

  const pods = cfg.map((c, ci) => {
    const v = top3[c.pos]
    if (!v) {
      return `<div style="background:${c.bg};border:2px solid ${c.brd};border-radius:12px;padding:18px 12px;text-align:center;min-height:${c.h};display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:2rem">${c.medal}</div>
        <div style="font-size:0.65rem;font-weight:800;letter-spacing:2px;color:${c.cor};margin-top:6px">${c.label}</div>
        <div style="color:#bbb;margin-top:8px;font-size:0.8rem">—</div>
      </div>`
    }

    const p   = pct(v.venda, v.meta)
    const url = fotoUrl(v, r2Base)
    const avHtml = url
      ? `<div style="width:60px;height:60px;border-radius:50%;overflow:hidden;margin:0 auto 8px;border:2px solid ${c.brd}"><img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='${ini(v.nome)}'"></div>`
      : `<div style="width:60px;height:60px;border-radius:50%;background:${c.avBg};color:${c.avCor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;margin:0 auto 8px;border:2px solid ${c.brd}">${ini(v.nome)}</div>`

    const premioHtml = showPremio && ci < regras.premios.length
      ? `<div style="display:inline-block;background:#fefce8;color:${c.cor};border:1px solid ${c.brd};border-radius:20px;padding:3px 12px;font-weight:700;font-size:0.78rem;margin-top:8px">🏆 R$ ${Number(regras.premios[ci]).toLocaleString('pt-BR')}</div>`
      : ''

    return `<div style="background:${c.bg};border:2px solid ${c.brd};border-radius:12px;padding:18px 12px;text-align:center;min-height:${c.h}">
      <div style="font-size:2rem;margin-bottom:6px">${c.medal}</div>
      ${avHtml}
      <div style="font-size:0.63rem;font-weight:800;letter-spacing:2px;color:${c.cor};margin-bottom:4px">${c.label}</div>
      <div style="font-weight:700;font-size:0.88rem;color:#1c1f26;margin-bottom:2px">${v.nome}</div>
      <div style="font-size:0.65rem;color:#888;margin-bottom:6px">${v.filial}</div>
      <div style="font-size:0.8rem;font-weight:700;color:${c.cor};margin-bottom:4px">${fmtPct(p)} da meta</div>
      <div style="font-size:0.7rem;color:#555">Mk ${Number(v.markup || 0).toFixed(2)}%</div>
      ${premioHtml}
    </div>`
  })

  // Ordem visual: 2º | 1º | 3º
  return `<div style="display:flex;gap:14px;align-items:flex-end;margin-bottom:24px">
    <div style="flex:1">${pods[1]}</div>
    <div style="flex:1">${pods[0]}</div>
    <div style="flex:1">${pods[2]}</div>
  </div>`
}

// ─────────────────────────────────────────────
//  Encerramento
// ─────────────────────────────────────────────

function encCard(v: Vendedor | undefined, pos: number, label: string, value: string, premio: string | null, r2Base: string): string {
  const medals = ['🥇', '🥈', '🥉']
  const medal  = medals[pos] ?? '🏅'
  const grads  = [
    { bg: 'linear-gradient(160deg,#fffbea,#fff3b0)', brd: '#f5c842', cor: '#c8860a', avBg: '#fffbea', avCor: '#c8860a' },
    { bg: 'linear-gradient(160deg,#f0f2f5,#e4e9f0)', brd: '#c0c8d8', cor: '#4a5568', avBg: '#f0f2f5', avCor: '#4a5568' },
    { bg: 'linear-gradient(160deg,#fdf3e8,#fae5c8)', brd: '#cd7f32', cor: '#8b5e1a', avBg: '#fdf3e8', avCor: '#8b5e1a' },
  ]
  const g = grads[pos] ?? grads[2]!

  if (!v) {
    return `<div style="background:${g.bg};border:2px solid ${g.brd};border-radius:12px;padding:14px 10px;text-align:center;flex:1">
      <div style="font-size:1.6rem">${medal}</div>
      <div style="font-size:0.6rem;font-weight:800;letter-spacing:2px;color:${g.cor};margin-top:4px">${label}</div>
      <div style="color:#bbb;margin-top:8px;font-size:0.75rem">—</div>
    </div>`
  }

  const url    = fotoUrl(v, r2Base)
  const avHtml = url
    ? `<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;margin:0 auto 6px;border:2px solid ${g.brd}"><img src="${url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'"></div>`
    : `<div style="width:52px;height:52px;border-radius:50%;background:${g.avBg};color:${g.avCor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;margin:0 auto 6px;border:2px solid ${g.brd}">${ini(v.nome)}</div>`

  return `<div style="background:${g.bg};border:2px solid ${g.brd};border-radius:12px;padding:14px 10px;text-align:center;flex:1">
    <div style="font-size:1.6rem;margin-bottom:4px">${medal}</div>
    ${avHtml}
    <div style="font-size:0.6rem;font-weight:800;letter-spacing:2px;color:${g.cor};margin-bottom:3px">${label}</div>
    <div style="font-weight:700;font-size:0.8rem;color:#1c1f26;margin-bottom:2px;line-height:1.2">${v.nome}</div>
    <div style="font-size:0.72rem;font-weight:700;color:${g.cor};margin-bottom:${premio ? '8px' : '0'}">${value}</div>
    ${premio ? `<div style="display:inline-block;background:#fefce8;color:${g.cor};border:1px solid ${g.brd};border-radius:20px;padding:2px 10px;font-weight:700;font-size:0.7rem">🏆 ${premio}</div>` : ''}
  </div>`
}

function encSection(icon: string, titulo: string, cards: string): string {
  return `<div style="margin-bottom:18px">
    <div style="background:#13161d;color:#f5c842;padding:7px 14px;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:0.95rem;letter-spacing:2.5px;margin-bottom:10px">
      ${icon} ${titulo}
    </div>
    <div style="display:flex;gap:10px;align-items:stretch">${cards}</div>
  </div>`
}

// ─────────────────────────────────────────────
//  Wrap HTML
// ─────────────────────────────────────────────

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'DM Sans', sans-serif; color: #1c1f26; padding: 32px 36px; background: #fff; }
    .pdf-page { page-break-after: always; }
    .pdf-page:last-child { page-break-after: avoid; }
  </style>
</head>
<body>${body}</body>
</html>`
}

// ─────────────────────────────────────────────
//  Ponto de entrada público
// ─────────────────────────────────────────────

export function generatePdfHtml(req: PdfRequest): string {
  const { vendedores, regras, r2BaseUrl, campanhaEncerrada = false } = req

  // ── Dados calculados pela mesma fonte do dashboard ──
  const data = prepareRankingData(vendedores, regras, campanhaEncerrada)

  const sortLabels: Record<SortMode, { header: string; sec: string }> = {
    pct:    { header: 'por % Meta',        sec: '% DA META'      },
    venda:  { header: 'por Valor Vendido', sec: 'VALOR VENDIDO'  },
    markup: { header: 'por Markup',        sec: 'MARKUP'         },
  }
  const lbl = sortLabels[req.sortMode]

  // Seleciona tabela e pódio corretos conforme sortMode
  const tabelaAtiva = req.sortMode === 'venda' ? data.tabelaVenda
                    : req.sortMode === 'pct'   ? data.tabelaPct
                    :                            data.tabelaMarkup

  const podiumAtivo = req.sortMode === 'venda' ? data.podiumVenda
                    : req.sortMode === 'pct'   ? data.podiumPct
                    :                            data.podiumMarkup

  let body = ''

  switch (req.type) {

    case 'ranking':
      body = `<div class="pdf-page">
        ${headerSection('Ranking Geral — ' + lbl.header)}
        ${kpiBar(vendedores)}
        ${secTitle('📊 RANKING POR ' + lbl.sec + ' — ' + vendedores.length + ' VENDEDORES')}
        ${tabela(tabelaAtiva, regras, r2BaseUrl, true)}
      </div>`
      break

    case 'podio':
      body = `<div class="pdf-page">
        ${headerSection('Pódio Geral — Top 3 ' + lbl.header)}
        ${kpiBar(vendedores)}
        ${secTitle('🏆 PÓDIO — TOP 3 POR ' + lbl.sec)}
        ${podio3(podiumAtivo, regras, r2BaseUrl, req.sortMode === 'markup')}
        ${vendedores.length > 3
          ? secTitle('📊 RANKING COMPLETO') + tabela(tabelaAtiva, regras, r2BaseUrl, true)
          : ''}
      </div>`
      break

    case 'filial': {
      const f     = req.filial || ''
      const grupo = vendedores.filter(v => v.filial === f)
      const gData = prepareRankingData(grupo, regras, campanhaEncerrada)

      const gTabela = req.sortMode === 'venda' ? gData.tabelaVenda
                    : req.sortMode === 'pct'   ? gData.tabelaPct
                    :                            gData.tabelaMarkup

      const gPodium = req.sortMode === 'venda' ? gData.podiumVenda
                    : req.sortMode === 'pct'   ? gData.podiumPct
                    :                            gData.podiumMarkup

      body = `<div class="pdf-page">
        ${headerSection('Ranking por Filial', f)}
        ${kpiBar(grupo)}
        ${secTitle('🏆 PÓDIO — ' + f + ' · TOP 3 POR ' + lbl.sec)}
        ${podio3(gPodium, regras, r2BaseUrl, req.sortMode === 'markup')}
        ${secTitle('📊 RANKING — ' + f + ' (' + grupo.length + ' vendedores)')}
        ${tabela(gTabela, regras, r2BaseUrl, false)}
      </div>`
      break
    }

    case 'todas': {
      const filiais = [...new Set(vendedores.map(v => v.filial))].sort()
      body = filiais.map(f => {
        const grupo = vendedores.filter(v => v.filial === f)
        const gData = prepareRankingData(grupo, regras, campanhaEncerrada)

        const gTabela = req.sortMode === 'venda' ? gData.tabelaVenda
                      : req.sortMode === 'pct'   ? gData.tabelaPct
                      :                            gData.tabelaMarkup

        const gPodium = req.sortMode === 'venda' ? gData.podiumVenda
                      : req.sortMode === 'pct'   ? gData.podiumPct
                      :                            gData.podiumMarkup

        return `<div class="pdf-page">
          ${headerSection('Ranking por Filial', f)}
          ${kpiBar(grupo)}
          ${secTitle('🏆 PÓDIO — ' + f + ' · TOP 3 POR ' + lbl.sec)}
          ${podio3(gPodium, regras, r2BaseUrl, req.sortMode === 'markup')}
          ${secTitle('📊 RANKING — ' + f)}
          ${tabela(gTabela, regras, r2BaseUrl, false)}
        </div>`
      }).join('')
      break
    }

    case 'encerramento': {
      const dataStr    = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      const totalEleg  = data.elegiveisMarkup.length
      const totalVend  = vendedores.length

      const cardsMarkup = [0, 1, 2].map(i => {
        const v = data.elegiveisMarkup[i]
        return encCard(v, i, `${i + 1}º LUGAR`,
          v ? `Mk ${Number(v.markup).toFixed(2)}%` : '—',
          i < regras.premios.length ? 'R$ ' + Number(regras.premios[i]).toLocaleString('pt-BR') : null,
          r2BaseUrl)
      }).join('')

      const cardsVenda = [0, 1, 2].map(i => {
        const v = data.elegiveisVenda[i]
        return encCard(v, i, `${i + 1}º LUGAR`,
          v ? fmt(v.venda) : '—',
          null, r2BaseUrl)
      }).join('')

      const cardsPct = [0, 1, 2].map(i => {
        const v = data.elegiveisPct[i]
        return encCard(v, i, `${i + 1}º LUGAR`,
          v ? fmtPct(pct(v.venda, v.meta)) : '—',
          null, r2BaseUrl)
      }).join('')

      // No encerramento, bônus markup mostra os top 3 elegíveis na ordem geral
      // (1º = vencedor do bônus, 2º e 3º = próximos elegíveis por markup, incluindo pódio)
      const cardsBonus = [0, 1, 2].map(i => {
        const v = data.elegiveisMarkup[i]
        const label = i === 0
          ? `⭐ BÔNUS R$ ${Number(regras.bonusMk).toLocaleString('pt-BR')}`
          : `${i + 1}º ELEGÍVEL`
        return encCard(v, i, label,
          v ? `Mk ${Number(v.markup).toFixed(2)}%` : '—',
          i === 0 && v ? 'R$ ' + Number(regras.bonusMk).toLocaleString('pt-BR') : null,
          r2BaseUrl)
      }).join('')

      body = `<div class="pdf-page" style="max-width:620px;margin:0 auto">
        <div style="border-bottom:3px solid #f5c842;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:3px;color:#13161d;line-height:1">
              ⚡ <span style="color:#e0a800">DENSUL</span> MT/MS
            </div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:2px;color:#555;margin-top:2px">
              ENCERRAMENTO DA CAMPANHA
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.65rem;color:#888">${dataStr}</div>
            <div style="font-size:0.65rem;color:#888;margin-top:2px">${totalEleg} elegíveis de ${totalVend} vendedores</div>
          </div>
        </div>
        ${encSection('🎯', 'PÓDIO — MARKUP',        cardsMarkup)}
        ${encSection('💰', 'PÓDIO — VALOR VENDIDO', cardsVenda)}
        ${encSection('📊', 'PÓDIO — % DA META',     cardsPct)}
        ${encSection('⭐', 'BÔNUS MARKUP',           cardsBonus)}
      </div>`
      break
    }
  }

  return wrapHtml(body)
}
