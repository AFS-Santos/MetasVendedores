import { useState, useEffect } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useToast } from '../hooks/useToast'
import { pct, fmtPct, uid } from '../lib/formatters'
import { Modal } from './Modal'

interface VendedorModalProps {
  open: boolean
  onClose: () => void
  editId: string | null
}

export function VendedorModal({ open, onClose, editId }: VendedorModalProps) {
  const vendedores = useDataStore(s => s.vendedores)
  const updateVendedor = useDataStore(s => s.updateVendedor)
  const addVendedor = useDataStore(s => s.addVendedor)
  const toast = useToast(s => s.show)

  const [codFilial, setCodFilial] = useState('')
  const [filial, setFilial] = useState('')
  const [codVend, setCodVend] = useState('')
  const [nome, setNome] = useState('')
  const [meta, setMeta] = useState('')
  const [venda, setVenda] = useState('')
  const [markup, setMarkup] = useState('')

  const isEdit = !!editId
  const vendedor = isEdit ? vendedores.find(v => v.id === editId) : null

  useEffect(() => {
    if (vendedor) {
      setCodFilial(String(vendedor.codFilial))
      setFilial(vendedor.filial)
      setCodVend(String(vendedor.codVend))
      setNome(vendedor.nome)
      setMeta(String(vendedor.meta))
      setVenda(String(vendedor.venda))
      setMarkup(String(vendedor.markup))
    } else {
      setCodFilial('')
      setFilial('')
      setCodVend('')
      setNome('')
      setMeta('')
      setVenda('')
      setMarkup('')
    }
  }, [vendedor, open])

  const metaNum = parseFloat(meta) || 0
  const vendaNum = parseFloat(venda) || 0
  const pctPreview = metaNum > 0 ? fmtPct(pct(vendaNum, metaNum)) : '—'

  const handleSave = () => {
    const nomeVal = nome.trim().toUpperCase()
    const filialVal = filial.trim().toUpperCase()
    if (!nomeVal) { toast('Informe o nome!', 'err'); return }
    if (!filialVal) { toast('Informe a filial!', 'err'); return }
    if (metaNum <= 0) { toast('Informe a meta!', 'err'); return }

    if (isEdit && editId) {
      updateVendedor(editId, {
        meta: metaNum,
        venda: vendaNum,
        markup: parseFloat(markup) || 0,
      })
      toast(`${nomeVal} atualizado!`)
    } else {
      addVendedor({
        id: uid(),
        codFilial: parseInt(codFilial) || 0,
        filial: filialVal,
        codVend: parseInt(codVend) || 0,
        nome: nomeVal,
        meta: metaNum,
        venda: vendaNum,
        markup: parseFloat(markup) || 0,
        foto: null,
      })
      toast(`${nomeVal} adicionado!`)
    }
    onClose()
  }

  const inputClass = "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-text font-body text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(245,200,66,0.07)] transition-all"
  const labelClass = "block text-[0.68rem] font-bold tracking-wider uppercase text-muted2 mb-1"

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-display text-xl tracking-[3px] text-gold mb-5">
        {isEdit ? 'EDITAR VENDEDOR' : 'NOVO VENDEDOR'}
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Cód. Filial</label>
          <input type="number" value={codFilial} onChange={e => setCodFilial(e.target.value)}
            className={inputClass} placeholder="Ex: 17838" readOnly={isEdit} style={{ opacity: isEdit ? 0.55 : 1 }} />
        </div>
        <div>
          <label className={labelClass}>Filial</label>
          <input type="text" value={filial} onChange={e => setFilial(e.target.value)}
            className={inputClass} placeholder="Ex: CUIABA" readOnly={isEdit} style={{ opacity: isEdit ? 0.55 : 1 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Cód. Vendedor</label>
          <input type="number" value={codVend} onChange={e => setCodVend(e.target.value)}
            className={inputClass} placeholder="Ex: 7400" readOnly={isEdit} style={{ opacity: isEdit ? 0.55 : 1 }} />
        </div>
        <div>
          <label className={labelClass}>Nome do Vendedor</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)}
            className={inputClass} placeholder="Ex: ALDEMIR ALVES" readOnly={isEdit} style={{ opacity: isEdit ? 0.55 : 1 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Meta Vendedor (R$)</label>
          <input type="number" value={meta} onChange={e => setMeta(e.target.value)} className={inputClass} placeholder="270000" />
        </div>
        <div>
          <label className={labelClass}>Valor Venda (R$)</label>
          <input type="number" value={venda} onChange={e => setVenda(e.target.value)} className={inputClass} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Markup Vendedor (%)</label>
          <input type="number" value={markup} onChange={e => setMarkup(e.target.value)} className={inputClass} placeholder="0" step="0.1" />
        </div>
        <div>
          <label className={labelClass}>% da Meta</label>
          <input type="text" value={pctPreview} readOnly className={`${inputClass} opacity-60 cursor-default`} />
        </div>
      </div>

      <div className="flex gap-2.5 justify-end mt-5">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-silver text-sm font-semibold hover:border-gold hover:text-gold transition-all">
          Cancelar
        </button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-gold text-bg text-sm font-semibold hover:bg-gold2 transition-all">
          Salvar
        </button>
      </div>
    </Modal>
  )
}
