import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'

/**
 * Middleware utilitário para autenticação e autorização multi-família.
 * @param req Request do handler
 * @param allowedRoles Array de roles permitidos (ex: ['OWNER', 'ADMIN'])
 * @param adminContext Contexto do SUPER_ADMIN ('family' ou 'admin') - opcional, vem do header
 * @returns { session, role, familyId, adminContext } ou { error }
 * 
 * IMPORTANTE:
 * - SUPER_ADMIN em modo 'family': Comporta-se como OWNER (usa familyId da sessão)
 * - SUPER_ADMIN em modo 'admin': Acesso a configurações globais (familyId pode ser null)
 * - OUTROS ROLES: familyId será o ID da família do usuário (acesso restrito)
 */
export async function requireAuth(req: Request, allowedRoles: string[] = [], adminContext?: 'family' | 'admin') {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.error('Sessão ou usuário não encontrado')
      return { error: { status: 401, message: 'Não autenticado.' } }
    }

    const { role, familyId } = session.user as { role?: string; familyId?: string }
    if (!role) {
      console.error('Role não encontrado na sessão', { role, familyId })
      return { error: { status: 401, message: 'Sessão inválida.' } }
    }

    // Se não foi passado adminContext, tenta pegar do header
    if (!adminContext && role === 'SUPER_ADMIN') {
      const contextHeader = req.headers.get('x-admin-context')
      adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    }

    // SUPER_ADMIN em modo 'family': Comporta-se como OWNER (usa familyId da sessão)
    if (role === 'SUPER_ADMIN' && adminContext === 'family') {
      if (!familyId) {
        console.error('SUPER_ADMIN em modo família precisa de familyId')
        return { error: { status: 401, message: 'Sessão inválida.' } }
      }
      
      // Verifica permissões como se fosse OWNER
      if (allowedRoles.length > 0 && !allowedRoles.includes('OWNER') && !allowedRoles.includes('SUPER_ADMIN')) {
        return { error: { status: 403, message: 'Acesso negado.' } }
      }
      
      return { session, role, familyId, adminContext: 'family' }
    }

    // SUPER_ADMIN em modo 'admin': Acesso a configurações globais (sem dados financeiros de outras famílias)
    if (role === 'SUPER_ADMIN' && adminContext === 'admin') {
      // SUPER_ADMIN sempre tem acesso em modo admin, independente de allowedRoles
      return { session, role, familyId: null, adminContext: 'admin' }
    }

    // Para outros roles, familyId é obrigatório
    if (!familyId) {
      console.error('FamilyId não encontrado na sessão', { role, familyId })
      return { error: { status: 401, message: 'Sessão inválida.' } }
    }

    // Verifica permissões para outros roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      console.error('Usuário não tem permissão para acessar este recurso', {
        userRole: role,
        allowedRoles,
      })
      return { error: { status: 403, message: 'Acesso negado.' } }
    }

    return { session, role, familyId, adminContext: 'family' }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return { error: { status: 500, message: 'Erro interno ao verificar autenticação.' } }
  }
}