/**
 * Rota de API para resetar a senha do Super Admin
 * IMPORTANTE: Remover esta rota após usar em produção!
 * 
 * Uso: POST /api/admin/reset-super-admin
 * Body: { password?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    // SEGURANÇA: Verificar se está em desenvolvimento ou se tem uma chave secreta
    const isDevelopment = process.env.NODE_ENV === 'development'
    const secretKey = req.headers.get('x-reset-secret') || req.nextUrl.searchParams.get('secret')
    const expectedSecret = process.env.ADMIN_RESET_SECRET || 'reset-super-admin-2024'

    if (!isDevelopment && secretKey !== expectedSecret) {
      return NextResponse.json(
        { error: 'Não autorizado. Chave secreta necessária.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const newPassword = body.password || 'superadmin123'

    console.log('🔐 Resetando senha do Super Admin...')

    const email = 'superadmin@meuassistente.com'

    // Buscar o usuário
    const user = await prisma.user.findFirst({
      where: { email },
      include: { family: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Super Admin não encontrado. Execute o seed primeiro.' },
        { status: 404 }
      )
    }

    // Gerar novo hash da senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    })

    // Verificar se a senha funciona
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      )
    }

    const isValid = await bcrypt.compare(newPassword, updatedUser.password)

    return NextResponse.json({
      success: true,
      message: 'Senha resetada com sucesso!',
      details: {
        email,
        passwordValid: isValid,
        userActive: updatedUser.isActive,
        familyActive: user.family.isActive,
      },
      credentials: {
        email,
        password: newPassword,
      },
    })
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senha', details: String(error) },
      { status: 500 }
    )
  }
}

