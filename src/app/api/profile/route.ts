import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'
import bcrypt from 'bcryptjs'

/**
 * GET - Buscar dados do perfil do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [])
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }

    const { role, familyId } = authResult
    const userId = (authResult.session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não encontrado.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        familyRole: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      } as any,
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ status: 'ok', user })
  } catch (error) {
    console.error('[PROFILE_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar perfil.' }, { status: 500 })
  }
}

/**
 * PATCH - Atualizar perfil do usuário logado (nome, email, senha)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [])
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }

    const userId = (authResult.session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não encontrado.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, avatar, familyRole, password, currentPassword } = body

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    // Se está alterando senha, verificar senha atual
    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Senha atual é obrigatória para alterar a senha.' }, { status: 400 })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 403 })
      }

      // Validar nova senha
      if (password.length < 6) {
        return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
      }
    }

    // Se está alterando email, verificar se já existe
    if (email && email !== currentUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: userId }
        },
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 })
      }
    }

    // Validar telefone se fornecido
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
      }
    }

    // Validar familyRole se fornecido
    if (familyRole && !['PAI', 'MAE', 'FILHO', 'FILHA', 'OUTROS'].includes(familyRole)) {
      return NextResponse.json({ error: 'Classificação familiar inválida.' }, { status: 400 })
    }

    // Atualizar usuário
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (avatar !== undefined) updateData.avatar = avatar || null
    if (familyRole !== undefined) updateData.familyRole = familyRole || null
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        familyRole: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      } as any,
    })

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Perfil atualizado com sucesso!',
      user: updatedUser 
    })
  } catch (error) {
    console.error('[PROFILE_PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 })
  }
}

