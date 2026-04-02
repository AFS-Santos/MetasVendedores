import { useState } from 'react'
import { useAutoSync } from './hooks/useAutoSync'
import { useDataStore } from './stores/useDataStore'
import { useUIStore } from './stores/useUIStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { KPISkeleton, RankingSkeleton } from './components/Skeletons'
import { Header } from './components/Header'
import { ConnectionPanel } from './components/ConnectionPanel'
import { KPIRow } from './components/KPIRow'
import { FilialTabs } from './components/FilialTabs'
import { RankingSection } from './components/RankingSection'
import { FilialChart } from './components/FilialChart'
import { VendedorModal } from './components/VendedorModal'
import { RegrasModal } from './components/RegrasModal'
import { MassEditModal } from './components/MassEditModal'
import { PdfExport } from './components/PdfExport'
import { Toast } from './components/Toast'
import type { PdfMode } from './components/PdfExport'
import type { RankingType } from './schemas/vendedor'

const RANKING_TABS: { type: RankingType; label: string; icon: string; subtitle: string }[] = [
  { type: 'venda', label: 'Valor Vendido', icon: '💰', subtitle: 'Sem regra de corte' },
  { type: 'pct', label: '% da Meta', icon: '📊', subtitle: 'Sem regra de corte' },
  { type: 'markup', label: 'Markup', icon: '🎯', subtitle: 'Mk > 51% · Meta ≥ 85%' },
]

export default function App() {
  useAutoSync()

  const syncStatus = useDataStore(s => s.syncStatus)
  const campanhaEncerrada = useDataStore(s => s.campanhaEncerrada)
  const activeRanking = useUIStore(s => s.activeRanking)
  const setActiveRanking = useUIStore(s => s.setActiveRanking)
  const isLoading = syncStatus === 'loading'

  const [vendedorModal, setVendedorModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [regrasModal, setRegrasModal] = useState(false)
  const [massEditModal, setMassEditModal] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfMode, setPdfMode] = useState<PdfMode>(null)

  const handleOpenAdd = () => { setEditId(null); setVendedorModal(true) }
  const handleEdit = (id: string) => { setEditId(id); setVendedorModal(true) }
  const openPdf = (mode: PdfMode) => { setPdfMode(mode); setPdfOpen(true) }

  const activeTab = RANKING_TABS.find(t => t.type === activeRanking)!

  return (
    <div className="px-4 sm:px-7 pb-14 max-w-[1480px] mx-auto">
      <Header
        onOpenAdd={handleOpenAdd}
        onOpenRegras={() => setRegrasModal(true)}
        onOpenMassEdit={() => setMassEditModal(true)}
        onPdfRanking={() => openPdf('ranking')}
        onPdfPodio={() => openPdf('podio')}
        onPdfFilial={() => openPdf('filial-select')}
      />

      <ErrorBoundary section="Conexão">
        <ConnectionPanel />
      </ErrorBoundary>

      <ErrorBoundary section="KPIs">
        {isLoading ? <KPISkeleton /> : <KPIRow />}
      </ErrorBoundary>

      <ErrorBoundary section="Filtros">
        <FilialTabs />
      </ErrorBoundary>

      {/* ── Ranking principal (1 pódio + 1 tabela, controlado por tabs) ── */}
      <ErrorBoundary section="Ranking">
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4 sm:mb-5">
          {/* Ranking type tabs */}
          <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1.5">
              {RANKING_TABS.map(tab => (
                <button
                  key={tab.type}
                  onClick={() => setActiveRanking(tab.type)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                    ${activeRanking === tab.type
                      ? 'bg-gold text-bg'
                      : 'text-muted2 hover:text-text hover:bg-surface2'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] text-muted2">{activeTab.subtitle}</span>
              {campanhaEncerrada && (
                <span className="text-[0.55rem] bg-red2/10 text-red2 border border-red2/25 rounded px-1.5 py-px">Encerrada</span>
              )}
            </div>
          </div>

          {/* Ranking content */}
          <div className="p-3 sm:p-4">
            {isLoading ? <RankingSkeleton /> : <RankingSection type={activeRanking} onEdit={handleEdit} />}
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary section="Gráfico">
        <FilialChart />
      </ErrorBoundary>

      {/* Modals */}
      <VendedorModal open={vendedorModal} onClose={() => setVendedorModal(false)} editId={editId} />
      <RegrasModal open={regrasModal} onClose={() => setRegrasModal(false)} />
      {massEditModal && <MassEditModal open={massEditModal} onClose={() => setMassEditModal(false)} />}

      <PdfExport open={pdfOpen} onClose={() => { setPdfOpen(false); setPdfMode(null) }} initialMode={pdfMode} />
      <Toast />
    </div>
  )
}
