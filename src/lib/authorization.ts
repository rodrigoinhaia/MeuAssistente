import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'

/**
 * Middleware utilitário para autenticação e autorização multi-família.
 * @param req Request do handler
 * @param allowedRoles Array de roles permitidos (ex: ['OWNER', 'ADMIN'])
 * @returns { session, role, familyId } ou { error }
 * 
 * IMPORTANTE:
 * - SUPER_ADMIN: familyId será null para indicar acesso global (todas as famílias)
 * - OUTROS ROLES: familyId será o ID da família do usuário (acesso restrito)
 */
export async function requireAuth(req: Request, allowedRoles: string[] = []) {
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

    // SUPER_ADMIN pode acessar tudo (não precisa de familyId)
    if (role === 'SUPER_ADMIN') {
      // SUPER_ADMIN sempre tem acesso, independente de allowedRoles
      return { session, role, familyId: null } // null indica acesso global
    }

    // Para outros roles, familyId é obrigatório
    if (!familyId) {
      console.error('FamilyId não encontrado na sessão (exceto SUPER_ADMIN)', { role, familyId })
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

    return { session, role, familyId }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return { error: { status: 500, message: 'Erro interno ao verificar autenticação.' } }
  }
}