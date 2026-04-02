/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  /** URL base pública do bucket R2 (ex: https://fotos.seu-dominio.com) */
  readonly VITE_R2_PUBLIC_URL?: string
  /** URL do Worker de PDF/PNG (ex: https://meta-vendedores-pdf.seu-subdomain.workers.dev) */
  readonly VITE_PDF_WORKER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// html2canvas não tem @types oficial atualizado
declare module 'html2canvas' {
  interface Options {
    scale?: number
    useCORS?: boolean
    allowTaint?: boolean
    backgroundColor?: string
    logging?: boolean
  }
  export default function html2canvas(
    element: HTMLElement,
    options?: Options
  ): Promise<HTMLCanvasElement>
}
