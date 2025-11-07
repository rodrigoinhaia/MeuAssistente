/**
 * Cliente API com suporte a contexto do SUPER_ADMIN
 * Envia automaticamente o header x-admin-context nas requisições
 */

import { getAdminContext } from './context'

/**
 * Cria headers com contexto do SUPER_ADMIN
 */
export function getApiHeaders(userRole?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Se for SUPER_ADMIN, adiciona o contexto
  if (userRole === 'SUPER_ADMIN' && typeof window !== 'undefined') {
    const context = getAdminContext(userRole)
    headers['x-admin-context'] = context
  }

  return headers
}

/**
 * Fetch wrapper que adiciona contexto automaticamente
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  userRole?: string
): Promise<Response> {
  const headers = {
    ...getApiHeaders(userRole),
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

