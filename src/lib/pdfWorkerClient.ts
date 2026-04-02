/**
 * Cliente para o Worker de PDF/PNG.
 *
 * O frontend envia os dados dos vendedores + regras,
 * o Worker renderiza server-side com Puppeteer e retorna
 * o arquivo binário (PDF ou PNG).
 *
 * Configura VITE_PDF_WORKER_URL no .env:
 *   VITE_PDF_WORKER_URL=https://meta-vendedores-pdf.SEU-SUBDOMAIN.workers.dev
 */

import type { Vendedor, Regras } from '../schemas/vendedor'
import type { SortMode } from './formatters'

const WORKER_URL = import.meta.env.VITE_PDF_WORKER_URL?.replace(/\/$/, '') || ''

interface ExportRequest {
  type: 'ranking' | 'podio' | 'filial' | 'todas'
  vendedores: Vendedor[]
  regras: Regras
  sortMode: SortMode
  filial?: string
  campanhaEncerrada?: boolean
}

/**
 * Verifica se o Worker de PDF está configurado.
 * Se não estiver, o frontend usa o fallback local (html2canvas).
 */
export function isPdfWorkerConfigured(): boolean {
  return !!WORKER_URL
}

/**
 * Gera PDF ou PNG via Worker.
 * Retorna o Blob do arquivo para download.
 */
async function callWorker(
  endpoint: '/pdf' | '/png',
  request: ExportRequest
): Promise<Blob> {
  if (!WORKER_URL) {
    throw new Error('VITE_PDF_WORKER_URL não configurada')
  }

  const res = await fetch(`${WORKER_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error((err as { error: string }).error || `Erro ${res.status}`)
  }

  return res.blob()
}

/** Trigger download de um Blob */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Gera e faz download de PDF via Worker.
 */
export async function exportPdf(request: ExportRequest): Promise<void> {
  const blob = await callWorker('/pdf', request)
  const dateStr = new Date().toISOString().slice(0, 10)
  const label = request.type === 'filial' && request.filial ? request.filial : request.type
  downloadBlob(blob, `ranking_${label}_${dateStr}.pdf`)
}

/**
 * Gera e faz download de PNG via Worker.
 */
export async function exportPng(request: ExportRequest): Promise<void> {
  const blob = await callWorker('/png', request)
  const dateStr = new Date().toISOString().slice(0, 10)
  const label = request.type === 'filial' && request.filial ? request.filial : request.type
  downloadBlob(blob, `ranking_${label}_${dateStr}.png`)
}
