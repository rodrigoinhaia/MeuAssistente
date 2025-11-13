import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'
import bcrypt from 'bcryptjs'

/**
 * PATCH - Alterar senha de um usuário (apenas para OWNER/SUPER_ADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(request, ['OWNER', 'SUPER_ADMIN'], adminContext)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }

    const { role: userRole, familyId, adminContext: context } = authResult
    const currentUserId = (authResult.session?.user as any)?.id

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    // Buscar usuário a ser atualizado
    const userToUpdate = await prisma.user.findUnique({
      where: { id },
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    // SUPER_ADMIN em modo admin pode alterar senha de qualquer usuário
    // OWNER e SUPER_ADMIN em modo família só podem alterar senha de usuários da sua família
    if (userRole === 'SUPER_ADMIN' && context === 'admin') {
      // Pode alterar senha de qualquer usuário
    } else {
      // Verificar se o usuário pertence à mesma família
      if (!familyId) {
        return NextResponse.json({ 
          error: 'FamilyId não encontrado. Não é possível validar permissão.' 
        }, { status: 400 })
      }
      
      if (userToUpdate.familyId !== familyId) {
        return NextResponse.json({ 
          error: 'Usuário não pertence a esta família.' 
        }, { status: 403 })
      }
    }

    // Não permitir alterar senha de OWNER
    if (userToUpdate.role === 'OWNER') {
      return NextResponse.json({ error: 'Não é possível alterar a senha de um OWNER.' }, { status: 403 })
    }

    // Não permitir alterar própria senha por esta rota (deve usar /api/profile)
    if (userToUpdate.id === currentUserId) {
      return NextResponse.json({ 
        error: 'Use a página de perfil para alterar sua própria senha.' 
      }, { status: 403 })
    }

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Senha alterada com sucesso!'
    })
  } catch (error) {
    console.error('[USER_PASSWORD_PATCH]', error)
    return NextResponse.json({ error: 'Erro ao alterar senha.' }, { status: 500 })
  }
}

