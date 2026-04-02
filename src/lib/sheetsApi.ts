import type { Vendedor } from '../schemas/vendedor'

/**
 * JSONP fetch — necessário porque Apps Script com "Qualquer pessoa"
 * retorna JSONP quando recebe callback, e evita problemas de CORS
 * em alguns navegadores/cenários.
 *
 * Se preferir, pode trocar por fetch() direto — o Apps Script
 * com ContentService já retorna JSON com CORS ok para GET.
 */
function jsonp<T>(url: string, timeout = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cb = '__mt_' + Date.now()
    const el = document.createElement('script')
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout — script demorou mais de 15s'))
    }, timeout)

    function cleanup() {
      clearTimeout(timer)
      delete (window as Record<string, unknown>)[cb]
      el.remove()
    }

    ;(window as Record<string, unknown>)[cb] = (data: T) => {
      cleanup()
      resolve(data)
    }

    el.onerror = () => {
      cleanup()
      reject(new Error('Falha ao carregar o script — URL inválida ou sem permissão'))
    }

    el.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb
    document.head.appendChild(el)
  })
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
  const data = await jsonp<SheetsGetResponse>(sheetsUrl + '?action=get')
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
  return jsonp<PushResponse>(url)
}

/** Busca fotos do Google Drive via Apps Script */
export async function fetchDriveFotos(sheetsUrl: string): Promise<FotosResponse> {
  return jsonp<FotosResponse>(sheetsUrl + '?action=getDriveFotos')
}
