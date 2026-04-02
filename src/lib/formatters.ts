/**
 * Re-export de shared/utils.
 * Frontend importa de '@/lib/formatters' por convenção,
 * mas a lógica real vive em shared/utils (fonte única).
 *
 * Também re-exporta os tipos de shared/types para conveniência.
 */

export {
  fmt,
  pct,
  fmtPct,
  ini,
  elegivel,
  elegivelMarkup,
  barColor,
  mkBadgeClass,
  sortVendedores,
  filterByRanking,
  uid,
} from '@shared/utils'

export type { SortMode } from '@shared/types'

/**
 * Classe de cor do avatar baseada no index (específico do frontend — usa Tailwind).
 * Não faz sentido no shared porque Tailwind só existe no frontend.
 */
export const avatarColorClass = (idx: number): string => {
  const colors = [
    'bg-gold/15 text-gold',
    'bg-blue2/15 text-blue2',
    'bg-green2/15 text-green2',
    'bg-red2/15 text-red2',
    'bg-silver/15 text-silver',
    'bg-bronze/15 text-bronze',
    'bg-purple-400/15 text-purple-300',
    'bg-sky-400/15 text-sky-300',
  ]
  return colors[idx % colors.length]!
}
