/**
 * Serviço de fotos — resolve URLs de fotos dos vendedores/filiais.
 *
 * Prioridade:
 *  1. Cloudflare R2 (se VITE_R2_PUBLIC_URL estiver configurada)
 *  2. Google Drive thumbnails (via drivePhotos do Apps Script)
 *  3. null (renderiza iniciais coloridas)
 *
 * ── Estrutura esperada no bucket R2 ──
 *  {VITE_R2_PUBLIC_URL}/
 *    vendedores/
 *      7400.jpg        ← código do vendedor
 *      41671.jpg
 *    filiais/
 *      17838.jpg       ← código da filial
 *      27549.png
 *
 * Formatos aceitos: jpg, jpeg, png, webp
 *
 * ── Como configurar ──
 *  1. Crie um bucket R2 no Cloudflare Dashboard
 *  2. Ative "Public access" (ou configure custom domain)
 *  3. Faça upload das fotos na estrutura acima
 *  4. No .env do projeto:  VITE_R2_PUBLIC_URL=https://fotos.seu-dominio.com
 *  5. No Cloudflare Pages: Settings → Environment Variables → adicione a mesma
 */

const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '') || ''

/** Cache de URLs R2 já verificadas (evita HEAD requests repetidos) */
const r2Cache = new Map<string, string | null>()

/**
 * Tenta resolver uma foto do R2.
 * Faz HEAD request para verificar se existe (apenas na primeira vez, cacheia resultado).
 * Retorna URL ou null.
 */
async function checkR2(pasta: 'vendedores' | 'filiais', codigo: number): Promise<string | null> {
  if (!R2_BASE) return null

  const key = `${pasta}/${codigo}`
  if (r2Cache.has(key)) return r2Cache.get(key)!

  // Tenta extensões comuns
  const extensoes = ['jpg', 'jpeg', 'png', 'webp']
  for (const ext of extensoes) {
    const url = `${R2_BASE}/${pasta}/${codigo}.${ext}`
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok) {
        r2Cache.set(key, url)
        return url
      }
    } catch {
      // R2 não acessível — ignora silenciosamente
    }
  }

  r2Cache.set(key, null)
  return null
}

/**
 * Resolve a foto de um vendedor.
 * Prioridade: R2 vendedor → R2 filial → Drive vendedor → Drive filial → null
 */
export async function resolveVendedorFoto(
  codVend: number,
  codFilial: number,
  drivePhotos: Record<string, string>
): Promise<string | null> {
  // 1. R2 por código do vendedor
  const r2Vend = await checkR2('vendedores', codVend)
  if (r2Vend) return r2Vend

  // 2. R2 por código da filial
  const r2Filial = await checkR2('filiais', codFilial)
  if (r2Filial) return r2Filial

  // 3. Drive (fallback existente)
  return drivePhotos[String(codVend)] || drivePhotos[String(codFilial)] || null
}

/**
 * Resolve foto síncrono (sem HEAD requests R2).
 * Usa cache do R2 + Drive. Para uso em renders onde async não é possível.
 */
export function resolveVendedorFotoSync(
  codVend: number,
  codFilial: number,
  drivePhotos: Record<string, string>
): string | null {
  // R2 cache hit
  const r2Vend = r2Cache.get(`vendedores/${codVend}`)
  if (r2Vend) return r2Vend
  const r2Filial = r2Cache.get(`filiais/${codFilial}`)
  if (r2Filial) return r2Filial

  // Drive fallback
  return drivePhotos[String(codVend)] || drivePhotos[String(codFilial)] || null
}

/**
 * Pre-warm: verifica todas as fotos R2 de uma vez.
 * Chamar após carregar vendedores para popular o cache.
 */
export async function preloadR2Photos(
  vendedores: { codVend: number; codFilial: number }[]
): Promise<void> {
  if (!R2_BASE) return

  const codVends = [...new Set(vendedores.map(v => v.codVend))]
  const codFiliais = [...new Set(vendedores.map(v => v.codFilial))]

  // Paralelo, sem bloquear — fire and forget com batching
  const checks = [
    ...codVends.map(c => checkR2('vendedores', c)),
    ...codFiliais.map(c => checkR2('filiais', c)),
  ]

  await Promise.allSettled(checks)
}

/** Retorna se R2 está configurado */
export function isR2Configured(): boolean {
  return !!R2_BASE
}
