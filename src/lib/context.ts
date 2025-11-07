/**
 * Sistema de Contexto para SUPER_ADMIN
 * 
 * SUPER_ADMIN pode alternar entre:
 * - "family": Gerencia sua própria família (comporta-se como OWNER)
 * - "admin": Gerencia configurações globais e usuários (não vê dados financeiros de outras famílias)
 */

export type AdminContext = 'family' | 'admin'

const CONTEXT_KEY = 'admin_context'

/**
 * Obtém o contexto atual do SUPER_ADMIN
 * @param userRole Role do usuário
 * @returns Contexto atual ou 'family' por padrão
 */
export function getAdminContext(userRole: string | undefined): AdminContext {
  if (userRole !== 'SUPER_ADMIN') {
    return 'family' // Usuários normais sempre estão no contexto família
  }
  
  if (typeof window === 'undefined') {
    return 'family' // Server-side, retorna padrão
  }
  
  const stored = localStorage.getItem(CONTEXT_KEY)
  return (stored === 'admin' || stored === 'family') ? stored : 'family'
}

/**
 * Define o contexto do SUPER_ADMIN
 * @param context Novo contexto
 */
export function setAdminContext(context: AdminContext): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONTEXT_KEY, context)
}

/**
 * Verifica se o usuário está no modo admin (SUPER_ADMIN em contexto admin)
 */
export function isAdminMode(userRole: string | undefined, context: AdminContext): boolean {
  return userRole === 'SUPER_ADMIN' && context === 'admin'
}

/**
 * Verifica se o usuário está no modo família (comporta-se como OWNER)
 */
export function isFamilyMode(userRole: string | undefined, context: AdminContext): boolean {
  if (userRole === 'SUPER_ADMIN') {
    return context === 'family'
  }
  return true // Usuários normais sempre estão no modo família
}

