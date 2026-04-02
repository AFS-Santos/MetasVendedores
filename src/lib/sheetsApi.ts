import type { Vendedor } from '../schemas/vendedor'

/**
 * fetch() direto — Apps Script com CORS liberado ("Qualquer pessoa") aceita GET normal.
 * Muito mais rápido que JSONP: aproveita cache HTTP, suporta AbortController e
 * não precisa manipular o DOM a cada requisição.
 */
async function appsScriptGet<T>(url: string, timeout = 15000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as T
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('Timeout — Apps Script demorou mais de 15s')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export interface SheetsGetResponse {
  vendedores: Vendedor[]
  erro?: string
}

export interface FotosResponse {
  fotos: Record<string, string>
}

export interface PushResponse {
  ok: boolean
  salvos: number
}

/** Busca vendedores do Google Sheets via Apps Script */
export async function fetchVendedores(sheetsUrl: string): Promise<SheetsGetResponse> {
  const data = await appsScriptGet<SheetsGetResponse>(sheetsUrl + '?action=get')
  if (!data || !Array.isArray(data.vendedores)) {
    throw new Error('Resposta inválida — rode a função "testar" no Apps Script primeiro')
  }
  // Converte markup: 0.5188 → 51.88
  data.vendedores = data.vendedores.map(v => ({
    ...v,
    markup: v.markup ? Math.round(v.markup * 10000) / 100 : 0,
  }))
  return data
}

/** Envia vendedores atualizados para o Google Sheets */
export async function pushVendedores(sheetsUrl: string, vendedores: Vendedor[]): Promise<PushResponse> {
  const url = sheetsUrl + '?action=set&data=' + encodeURIComponent(JSON.stringify(vendedores))
  return appsScriptGet<PushResponse>(url)
}

/** Busca fotos do Google Drive via Apps Script */
export async function fetchDriveFotos(sheetsUrl: string): Promise<FotosResponse> {
  return appsScriptGet<FotosResponse>(sheetsUrl + '?action=getDriveFotos')
}
