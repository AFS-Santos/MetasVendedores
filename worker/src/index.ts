/**
 * Meta Vendedores — PDF/PNG Worker
 *
 * Cloudflare Worker com Browser Rendering API.
 * Recebe dados dos vendedores via POST, renderiza HTML com Puppeteer,
 * retorna PDF ou PNG.
 *
 * Endpoints:
 *   POST /pdf   → retorna application/pdf
 *   POST /png   → retorna image/png
 *   GET  /health → 200 OK
 *
 * Body (JSON):
 *   {
 *     type: 'ranking' | 'podio' | 'filial' | 'todas',
 *     vendedores: [...],
 *     regras: {...},
 *     sortMode: 'markup' | 'pct' | 'venda',
 *     filial?: 'CUIABA'  // para type='filial'
 *   }
 */

import puppeteer from '@cloudflare/puppeteer'
import { generatePdfHtml } from '../../shared/pdfTemplates'
import type { PdfRequest } from '../../shared/pdfTemplates'

interface Env {
  BROWSER: Fetcher
  FOTOS_BUCKET: R2Bucket
  R2_PUBLIC_URL: string
  ALLOWED_ORIGINS: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // ── CORS ──
    const origin = request.headers.get('Origin') || ''
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim())
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*'

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // ── Health check ──
    if (path === '/health') {
      return new Response('OK', { headers: corsHeaders })
    }

    // ── PDF / PNG ──
    if ((path === '/pdf' || path === '/png') && request.method === 'POST') {
      try {
        const body = await request.json() as Omit<PdfRequest, 'r2BaseUrl'>

        // Validate minimal fields
        if (!body.type || !Array.isArray(body.vendedores) || !body.regras) {
          return new Response(
            JSON.stringify({ error: 'Campos obrigatórios: type, vendedores, regras' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const pdfRequest: PdfRequest = {
          ...body,
          sortMode: body.sortMode || 'pct',
          r2BaseUrl: (env.R2_PUBLIC_URL || '').replace(/\/$/, ''),
        }

        // Generate full HTML
        const html = generatePdfHtml(pdfRequest)

        // Launch browser
        const browser = await puppeteer.launch(env.BROWSER)
        const page = await browser.newPage()

        // Set viewport for consistent rendering
        await page.setViewport({ width: 800, height: 600 })

        // Load HTML (with waitUntil to ensure fonts + images load)
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 })

        let output: Buffer | Uint8Array
        let contentType: string
        let filename: string

        const dateStr = new Date().toISOString().slice(0, 10)
        const typeLabel = pdfRequest.type === 'filial' && pdfRequest.filial
          ? pdfRequest.filial
          : pdfRequest.type

        if (path === '/pdf') {
          output = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
          }) as Buffer
          contentType = 'application/pdf'
          filename = `ranking_${typeLabel}_${dateStr}.pdf`
        } else {
          // PNG: full page screenshot
          output = await page.screenshot({
            fullPage: true,
            type: 'png',
          }) as Uint8Array
          contentType = 'image/png'
          filename = `ranking_${typeLabel}_${dateStr}.png`
        }

        await browser.close()

        return new Response(output, {
          headers: {
            ...corsHeaders,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        console.error('Worker error:', message)
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },
}
