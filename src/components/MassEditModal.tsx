import { useState, useCallback, useEffect, useMemo } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useToast } from '../hooks/useToast'
import { pct, fmtPct, barColor } from '../lib/formatters'
import { Avatar } from './Avatar'

interface MassEditModalProps {
  open: boolean
  onClose: () => void
}

interface FieldData {
  meta: number
  venda: number
  markup: number
}

export function MassEditModal({ open, onClose }: MassEditModalProps) {
  const vendedores = useDataStore(s => s.vendedores)
  const setVendedores = useDataStore(s => s.setVendedores)
  const pushToSheets = useDataStore(s => s.pushToSheets)
  const sheetsUrl = useDataStore(s => s.sheetsUrl)
  const toast = useToast(s => s.show)

  // FIX: snapshot recria sempre que o modal abre (não apenas na montagem)
  const [snapshot, setSnapshot] = useState<Map<string, FieldData>>(new Map())
  const [localData, setLocalData] = useState<Map<string, FieldData>>(new Map())
  const [changedCount, setChangedCount] = useState(0)

  useEffect(() => {
    if (open) {
      const snap = new Map<string, FieldData>()
      const local = new Map<string, FieldData>()
      vendedores.forEach(v => {
        const d = { meta: v.meta, venda: v.venda, markup: v.markup }
        snap.set(v.id, d)
        local.set(v.id, { ...d })
      })
      setSnapshot(snap)
      setLocalData(local)
      setChangedCount(0)
    }
  }, [open, vendedores])

  const sorted = useMemo(() =>
    [...vendedores].sort((a, b) =>
      a.filial.localeCompare(b.filial) || a.nome.localeCompare(b.nome)
    ),
    [vendedores]
  )

  const updateField = useCallback((id: string, field: keyof FieldData, value: number) => {
    setLocalData(prev => {
      const next = new Map(prev)
      const current = next.get(id)
      if (current) {
        next.set(id, { ...current, [field]: value })
      }
      // Count changes
      let count = 0
      next.forEach((d, did) => {
        const orig = snapshot.get(did)
        if (orig && (orig.meta !== d.meta || orig.venda !== d.venda || orig.markup !== d.markup)) count++
      })
      setChangedCount(count)
      return next
    })
  }, [snapshot])

  const handleReset = () => {
    const reset = new Map<string, FieldData>()
    snapshot.forEach((v, k) => reset.set(k, { ...v }))
    setLocalData(reset)
    setChangedCount(0)
  }

  const handleSave = () => {
    const updated = vendedores.map(v => {
      const ld = localData.get(v.id)
      return ld ? { ...v, meta: ld.meta, venda: ld.venda, markup: ld.markup } : v
    })
    setVendedores(updated)
    if (sheetsUrl) pushToSheets()
    toast(`✅ ${changedCount > 0 ? changedCount + ' campo(s) atualizados!' : 'Dados salvos!'}`)
    onClose()
  }

  const handleTab = (e: React.KeyboardEvent, field: string, currentIdx: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const inputs = document.querySelectorAll<HTMLInputElement>(`.mass-input-${field}`)
      const nextIdx = (currentIdx + (e.shiftKey ? -1 : 1) + inputs.length) % inputs.length
      inputs[nextIdx]?.focus()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-5"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[860px] max-h-[90vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display text-lg tracking-[3px] text-gold">✏️ Edição em Massa</h2>
            <div className="text-xs text-muted2 mt-0.5">Clique em qualquer valor para editar · Tab para avançar · Enter para confirmar</div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handleReset} className="px-3 py-1.5 rounded-lg border border-border text-silver text-xs font-semibold hover:border-gold hover:text-gold transition-all">
              ↺ Desfazer
            </button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-border text-silver text-xs font-semibold hover:border-gold hover:text-gold transition-all">
              ✕
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left border-b border-border w-9" />
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left border-b border-border">Vendedor</th>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-left border-b border-border">Filial</th>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-right border-b border-border w-[130px]">Meta (R$)</th>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-right border-b border-border w-[130px]">Venda (R$)</th>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-right border-b border-border w-[90px]">Markup (%)</th>
                <th className="sticky top-0 z-10 bg-surface2 px-3.5 py-2.5 text-[0.62rem] font-bold tracking-[1.5px] uppercase text-muted2 text-right border-b border-border w-[60px]">% Meta</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, rowIdx) => {
                const ld = localData.get(v.id)
                const meta = ld?.meta ?? v.meta
                const venda = ld?.venda ?? v.venda
                const markup = ld?.markup ?? v.markup
                const p = pct(venda, meta)
                const barClr = barColor(p)
                const origIdx = vendedores.findIndex(x => x.id === v.id)

                const isChanged = (field: keyof FieldData) => {
                  const orig = snapshot.get(v.id)
                  return orig ? orig[field] !== (ld?.[field] ?? v[field]) : false
                }

                const inputClass = (field: keyof FieldData) =>
                  `w-full bg-transparent border rounded-md px-2 py-1 text-text font-body text-sm text-right outline-none transition-all
                  ${isChanged(field) ? 'border-green2/50 bg-green2/5' : 'border-transparent hover:border-border hover:bg-surface2'}
                  focus:border-gold focus:bg-surface2 focus:shadow-[0_0_0_3px_rgba(245,200,66,0.08)]
                  mass-input-${field}`

                return (
                  <tr key={v.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <Avatar vendedor={v} size={28} idx={origIdx} />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="font-semibold text-sm">{v.nome}</div>
                      <div className="text-[0.65rem] text-muted2">Cód {v.codVend}</div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-surface3 text-muted2 whitespace-nowrap">{v.filial}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input
                        type="number"
                        value={meta}
                        onChange={e => updateField(v.id, 'meta', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleTab(e, 'meta', rowIdx)}
                        className={inputClass('meta')}
                        step="1000"
                        min="0"
                      />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input
                        type="number"
                        value={venda}
                        onChange={e => updateField(v.id, 'venda', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleTab(e, 'venda', rowIdx)}
                        className={inputClass('venda')}
                        step="100"
                        min="0"
                      />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input
                        type="number"
                        value={markup}
                        onChange={e => updateField(v.id, 'markup', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleTab(e, 'markup', rowIdx)}
                        className={inputClass('markup')}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="text-xs text-right font-bold pr-1" style={{ color: barClr }}>{fmtPct(p)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex items-center justify-between flex-shrink-0 gap-3 flex-wrap">
          <span className="text-xs text-green2 font-semibold">
            {changedCount > 0 ? `${changedCount} campo${changedCount > 1 ? 's' : ''} alterado${changedCount > 1 ? 's' : ''}` : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-silver text-sm font-semibold hover:border-gold hover:text-gold transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-gold text-bg text-sm font-semibold hover:bg-gold2 transition-all">
              💾 Salvar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
