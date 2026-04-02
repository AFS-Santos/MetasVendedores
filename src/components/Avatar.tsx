import { useEffect, useState } from 'react'
import { ini } from '../lib/formatters'
import { useDataStore } from '../stores/useDataStore'
import { resolveVendedorFotoSync } from '../lib/r2Photos'

const BG_COLORS = [
  'bg-gold/15', 'bg-blue2/15', 'bg-green2/15', 'bg-red2/15',
  'bg-silver/15', 'bg-bronze/15', 'bg-purple-400/15', 'bg-sky-400/15',
]
const TEXT_COLORS = [
  'text-gold', 'text-blue2', 'text-green2', 'text-red2',
  'text-silver', 'text-bronze', 'text-purple-300', 'text-sky-300',
]

interface AvatarProps {
  vendedor: { codVend: number; codFilial?: number; nome: string; foto?: string | null }
  size?: number
  idx?: number
}

export function Avatar({ vendedor, size = 30, idx = 0 }: AvatarProps) {
  const drivePhotos = useDataStore(s => s.drivePhotos)
  const [imgError, setImgError] = useState(false)

  // Resolve foto: R2 cache → Drive → null
  const foto = vendedor.foto
    || resolveVendedorFotoSync(vendedor.codVend, vendedor.codFilial ?? 0, drivePhotos)

  const bgClass = BG_COLORS[idx % 8]!
  const textClass = TEXT_COLORS[idx % 8]!
  const fontSize = Math.round(size * 0.28)
  const initials = ini(vendedor.nome)

  // Reset error quando foto muda
  useEffect(() => { setImgError(false) }, [foto])

  if (foto && !imgError) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src={foto}
          alt={vendedor.nome}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center font-display ${bgClass} ${textClass}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initials}
    </div>
  )
}
