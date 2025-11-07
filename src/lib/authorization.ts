import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'

/**
 * Middleware utilitário para autenticação e autorização multi-família.
 * @param req Request do handler
 * @param allowedRoles Array de roles permitidos (ex: ['OWNER', 'ADMIN'])
 * @returns { session, role, familyId } ou { error }
 */
export async function requireAuth(req: Request, allowedRoles: string[] = []) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.error('Sessão ou usuário não encontrado')
      return { error: { status: 401, message: 'Não autenticado.' } }
    }

    const { role, familyId } = session.user as { role?: string; familyId?: string }
    if (!role || !familyId) {
      console.error('Role ou familyId não encontrados na sessão', { role, familyId })
      return { error: { status: 401, message: 'Sessão inválida.' } }
    }

    // SUPER_ADMIN pode acessar tudo
    if (role === 'SUPER_ADMIN') {
      return { session, role, familyId }
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