import { useState, useEffect } from 'react'
import { useDataStore } from '../stores/useDataStore'
import { useToast } from '../hooks/useToast'
import { REGRAS_DEFAULT } from '../schemas/vendedor'
import { Modal } from './Modal'

interface RegrasModalProps {
  open: boolean
  onClose: () => void
}

export function RegrasModal({ open, onClose }: RegrasModalProps) {
  const regras = useDataStore(s => s.regras)
  const setRegras = useDataStore(s => s.setRegras)
  const toast = useToast(s => s.show)

  const [mkMin, setMkMin] = useState('')
  const [metaMin, setMetaMin] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const [bonusMk, setBonusMk] = useState('')
  const [bonusFilial, setBonusFilial] = useState('')

  useEffect(() => {
    if (open) {
      setMkMin(String(regras.mkMin))
      setMetaMin(String(regras.metaMin))
      setP1(String(regras.premios[0]))
      setP2(String(regras.premios[1]))
      setP3(String(regras.premios[2]))
      setBonusMk(String(regras.bonusMk))
      setBonusFilial(String((regras.bonusFilial * 100).toFixed(2)))
    }
  }, [open, regras])

  const handleSave = () => {
    const bfRaw = parseFloat(bonusFilial)
    setRegras({
      mkMin: parseFloat(mkMin) || REGRAS_DEFAULT.mkMin,
      metaMin: parseFloat(metaMin) || REGRAS_DEFAULT.metaMin,
      premios: [parseFloat(p1) || REGRAS_DEFAULT.premios[0], parseFloat(p2) || REGRAS_DEFAULT.premios[1], parseFloat(p3) || REGRAS_DEFAULT.premios[2]],
      bonusMk: parseFloat(bonusMk) || REGRAS_DEFAULT.bonusMk,
      bonusFilial: (isNaN(bfRaw) ? 0.5 : bfRaw) / 100,
    })
    toast('✅ Regras atualizadas com sucesso!')
    onClose()
  }

  const inputClass = "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-text font-body text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(245,200,66,0.07)] transition-all"
  const labelClass = "block text-[0.68rem] font-bold tracking-wider uppercase text-muted2 mb-1"

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-display text-xl tracking-[3px] text-gold mb-5">⚙️ Regras da Campanha</h2>

      <div className="space-y-3">
        <div>
          <label className={labelClass}>Markup Mínimo para Concorrer (%)</label>
          <input type="number" value={mkMin} onChange={e => setMkMin(e.target.value)} className={inputClass} min="0" max="100" step="0.1" />
        </div>

        <div>
          <label className={labelClass}>% Mínimo da Meta para Concorrer</label>
          <input type="number" value={metaMin} onChange={e => setMetaMin(e.target.value)} className={inputClass} min="0" max="100" step="1" />
        </div>

        <div className="border-t border-border pt-3.5 mt-1">
          <div className="text-[0.68rem] font-bold tracking-wider uppercase text-muted2 mb-3">Prêmios do Pódio</div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={labelClass}>🥇 1º Lugar (R$)</label>
              <input type="number" value={p1} onChange={e => setP1(e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>🥈 2º Lugar (R$)</label>
              <input type="number" value={p2} onChange={e => setP2(e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>🥉 3º Lugar (R$)</label>
              <input type="number" value={p3} onChange={e => setP3(e.target.value)} className={inputClass} min="0" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3.5 mt-1">
          <div className="text-[0.68rem] font-bold tracking-wider uppercase text-muted2 mb-3">Bônus</div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>⭐ Bônus Melhor Markup (R$)</label>
              <input type="number" value={bonusMk} onChange={e => setBonusMk(e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>🏢 Bônus Melhor Filial (%)</label>
              <input type="number" value={bonusFilial} onChange={e => setBonusFilial(e.target.value)} className={inputClass} min="0" max="100" step="0.01" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 justify-end mt-5 border-t border-border pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-silver text-sm font-semibold hover:border-gold hover:text-gold transition-all">
          Cancelar
        </button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-gold text-bg text-sm font-semibold hover:bg-gold2 transition-all">
          💾 Salvar Regras
        </button>
      </div>
    </Modal>
  )
}
