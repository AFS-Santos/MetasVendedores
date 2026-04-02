import { useState, useRef, useEffect } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useToast } from '../hooks/useToast'
import { generatePdfHtml } from '@shared/pdfTemplates'
import { isPdfWorkerConfigured, exportPdf, exportPng } from '../lib/pdfWorkerClient'
import { ini } from '../lib/formatters'
import type { SortMode } from '../lib/formatters'
import type { PdfRequest } from '@shared/pdfTemplates'

export type PdfMode = 'ranking' | 'podio' | 'filial-select' | 'filial' | 'todas' | 'encerramento' | null

interface PdfExportProps {
  open: boolean
  onClose: () => void
  initialMode: PdfMode
}

export function PdfExport({ open, onClose, initialMode }: PdfExportProps) {
  const vendedores = useDataStore(s => s.vendedores)
  const regras = useDataStore(s => s.regras)
  const campanhaEncerrada = useDataStore(s => s.campanhaEncerrada)
  const toast = useToast(s => s.show)

  const [pdfSort, setPdfSort] = useState<SortMode>('pct')
  const [mode, setMode] = useState<PdfMode>(initialMode)
  const [selectedFilial, setSelectedFilial] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const useWorker = isPdfWorkerConfigured()

  useEffect(() => {
    if (open && initialMode !== null && initialMode !== 'filial') {
      setMode(initialMode)
      setSelectedFilial(null)
    }
  }, [open, initialMode])

  if (!open) return null

  // Resolve current export type for worker calls
  const exportType = mode === 'filial-select' ? null
    : mode === 'filial' ? 'filial' as const
    : mode as 'ranking' | 'podio' | 'todas' | 'encerramento' | null

  // Build request for both preview and Worker export
  const pdfReq: PdfRequest = {
    type: (exportType || 'ranking') as PdfRequest['type'],
    vendedores,
    regras,
    sortMode: pdfSort,
    filial: selectedFilial || undefined,
    r2BaseUrl: import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '') || '',
    campanhaEncerrada,
  }

  // Generate HTML for local preview
  let htmlContent = ''
  let title = ''
  if (mode === 'ranking') {
    htmlContent = generatePdfHtml({ ...pdfReq, type: 'ranking' })
    title = '📄 PDF RANKING GERAL'
  } else if (mode === 'podio') {
    htmlContent = generatePdfHtml({ ...pdfReq, type: 'podio' })
    title = '🏆 PDF PÓDIO GERAL'
  } else if (mode === 'filial' && selectedFilial) {
    htmlContent = generatePdfHtml({ ...pdfReq, type: 'filial', filial: selectedFilial })
    title = '🏢 PDF — ' + selectedFilial
  } else if (mode === 'todas') {
    htmlContent = generatePdfHtml({ ...pdfReq, type: 'todas' })
    title = '🌐 PDF TODAS AS FILIAIS'
  } else if (mode === 'encerramento') {
    htmlContent = generatePdfHtml({ ...pdfReq, type: 'encerramento' })
    title = '🏆 ENCERRAMENTO DA CAMPANHA'
  } else if (mode === 'filial-select') {
    title = '🏢 SELECIONAR FILIAL'
  }

  // ── Worker-based export ──
  const handleWorkerExport = async (format: 'pdf' | 'png') => {
    if (!exportType) return
    setExporting(true)
    try {
      const request = {
        type: exportType,
        vendedores,
        regras,
        sortMode: pdfSort,
        filial: selectedFilial || undefined,
        campanhaEncerrada,
      }
      if (format === 'pdf') {
        await exportPdf(request)
      } else {
        await exportPng(request)
      }
      toast(`✅ ${format.toUpperCase()} gerado com sucesso!`)
    } catch (err) {
      console.error(`Worker ${format} error:`, err)
      toast(`Erro ao gerar ${format.toUpperCase()}`, 'err')
    } finally {
      setExporting(false)
    }
  }

  // ── Fallback: local print (PDF) ──
  const handleLocalPrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast('Popup bloqueado — permita popups para imprimir', 'err')
      return
    }
    printWindow.document.write(`<!DOCTYPE html>
      <html><head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'DM Sans', sans-serif; color: #1c1f26; margin: 0; padding: 32px 36px; }
          .pdf-page { page-break-after: always; }
          .pdf-page:last-child { page-break-after: avoid; }
          @media print { body { padding: 12px; } }
        </style>
      </head><body>${htmlContent}</body></html>`)
    printWindow.document.close()
    printWindow.onload = () => { setTimeout(() => { printWindow.print() }, 500) }
  }

  // ── Fallback: local PNG (html2canvas) ──
  const handleLocalPng = async () => {
    if (!contentRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const clone = contentRef.current.cloneNode(true) as HTMLElement
      clone.style.cssText = `position:absolute;left:-9999px;top:0;background:#fff;padding:32px 36px;font-family:DM Sans,sans-serif;color:#1c1f26;width:${contentRef.current.offsetWidth}px`
      document.body.appendChild(clone)

      clone.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || ''
        if (src.startsWith('data:')) return
        const alt = img.getAttribute('alt') || '?'
        const initials = ini(alt)
        const colors = ['#e3f0ff', '#fff3e0', '#e8f5e9', '#fce4ec', '#f3e5f5', '#e0f7fa']
        const tcols = ['#1565c0', '#e65100', '#1b5e20', '#880e4f', '#4a148c', '#006064']
        const ci = (initials.charCodeAt(0) || 0) % 6
        const span = document.createElement('div')
        const imgParent = img.closest('[style*="60px"]')
        const size = imgParent ? '60px' : '28px'
        span.style.cssText = `width:${size};height:${size};border-radius:50%;background:${colors[ci]};color:${tcols[ci]};display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${size === '60px' ? '20px' : '10px'};font-family:DM Sans,sans-serif;flex-shrink:0`
        span.textContent = initials
        img.parentElement?.replaceChild(span, img)
      })

      const canvas = await html2canvas(clone, { scale: 2, useCORS: false, allowTaint: false, backgroundColor: '#ffffff', logging: false })
      document.body.removeChild(clone)

      const titleClean = title.replace(/[^a-zA-Z0-9À-ú\s]/g, '').trim().replace(/\s+/g, '_') || 'ranking'
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${titleClean}_${new Date().toISOString().slice(0, 10)}.png`
      link.click()
      toast('✅ Imagem PNG salva!')
    } catch (err) {
      console.error('exportarImagem:', err)
      const leftover = document.querySelector('[style*="left:-9999px"]')
      if (leftover) document.body.removeChild(leftover)
      toast('Erro ao gerar imagem', 'err')
    } finally {
      setExporting(false)
    }
  }

  // ── Dispatch to Worker or fallback ──
  const handlePdf = () => useWorker ? handleWorkerExport('pdf') : handleLocalPrint()
  const handlePng = () => useWorker ? handleWorkerExport('png') : handleLocalPng()

  const handleSelectFilial = (f: string) => {
    setSelectedFilial(f)
    setMode('filial')
  }

  const filiais = [...new Set(vendedores.map(v => v.filial))].sort()

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[200] flex items-start justify-center p-5 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl w-full max-w-[800px] my-auto relative shadow-2xl">
        {/* Toolbar */}
        <div className="sticky top-0 bg-[#13161d] px-5 py-3 flex items-center justify-between rounded-t-xl z-10 gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gold font-display text-base tracking-[2px]">{title}</span>
            {useWorker && mode !== 'filial-select' && (
              <span className="text-[0.6rem] bg-green2/15 text-green2 border border-green2/30 rounded px-1.5 py-px">Server</span>
            )}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {mode !== 'filial-select' && (
              <>
                {mode !== 'encerramento' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.68rem] text-muted2 whitespace-nowrap">Ordenar por:</span>
                    <select
                      value={pdfSort}
                      onChange={e => setPdfSort(e.target.value as SortMode)}
                      className="bg-surface3 text-text border border-border rounded-md px-2.5 py-1 text-xs font-body cursor-pointer outline-none"
                    >
                      <option value="pct">% da Meta</option>
                      <option value="venda">Valor Vendido</option>
                      <option value="markup">Markup</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={handlePdf}
                  disabled={exporting}
                  className="bg-gold text-[#13161d] border-none rounded-lg px-4 py-1.5 font-bold text-xs cursor-pointer hover:bg-gold2 transition-all disabled:opacity-50"
                >
                  {exporting ? '⏳...' : '🖨️ Salvar PDF'}
                </button>
                <button
                  onClick={handlePng}
                  disabled={exporting}
                  className="bg-transparent text-muted2 border border-border rounded-lg px-3.5 py-1.5 font-bold text-xs cursor-pointer hover:border-gold hover:text-gold transition-all disabled:opacity-50"
                >
                  {exporting ? '⏳...' : '🖼️ Salvar PNG'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="bg-none border-none text-muted2 cursor-pointer text-xl leading-none p-1 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content / Preview */}
        <div ref={contentRef} className="p-8 font-body text-[#1c1f26]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {mode === 'filial-select' ? (
            <div>
              <div className="border-b-2 border-[#f5c842] pb-3 mb-4">
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: 2, color: '#13161d' }}>
                  ⚡ <span style={{ color: '#e0a800' }}>DENSUL</span> MT/MS
                </div>
                <div className="text-sm text-gray-500">Escolha a filial para gerar o PDF:</div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {filiais.map(f => {
                  const cnt = vendedores.filter(v => v.filial === f).length
                  return (
                    <button
                      key={f}
                      onClick={() => handleSelectFilial(f)}
                      className="bg-[#f7f8fc] border border-[#e2e7f0] rounded-lg px-4 py-2.5 cursor-pointer font-body text-sm font-semibold text-[#1c1f26] flex items-center justify-between gap-3 w-full hover:border-gold hover:bg-[#fffbea] transition-all"
                    >
                      <span>🏢 {f}</span>
                      <span className="bg-[#13161d] text-gold rounded-full px-2.5 py-0.5 text-xs font-bold">{cnt} vend.</span>
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-[#e2e7f0] pt-3.5">
                <button
                  onClick={() => setMode('todas')}
                  className="w-full bg-[#13161d] text-gold border-none rounded-lg py-3 cursor-pointer font-body text-sm font-bold tracking-wider hover:bg-[#1c2130] transition-all"
                >
                  🌐 TODAS AS FILIAIS
                </button>
              </div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          )}
        </div>
      </div>
    </div>
  )
}
