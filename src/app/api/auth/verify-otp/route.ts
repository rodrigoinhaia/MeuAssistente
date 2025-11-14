import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/authOptions'
import { verifyOTP } from '@/lib/otp'

/**
 * POST - Verificar código OTP
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, userId: targetUserId } = body

    if (!code) {
      return NextResponse.json(
        { status: 'error', message: 'Código é obrigatório.' },
        { status: 400 }
      )
    }

    // Se userId foi fornecido, é admin verificando outro usuário
    let userId: string
    if (targetUserId) {
      // Verificar se é admin
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { status: 'error', message: 'Você precisa estar autenticado.' },
          { status: 401 }
        )
      }
      const userRole = (session.user as any)?.role
      if (userRole !== 'OWNER' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { status: 'error', message: 'Apenas admins podem verificar outros usuários.' },
          { status: 403 }
        )
      }
      userId = targetUserId
    } else {
      // Usuário verificando a si mesmo
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { status: 'error', message: 'Você precisa estar autenticado para verificar o código.' },
          { status: 401 }
        )
      }
      userId = (session.user as any)?.id
    }

    // Verificar código
    const isValid = await verifyOTP(userId, code)

    if (!isValid) {
      return NextResponse.json(
        { status: 'error', message: 'Código inválido ou expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      message: 'WhatsApp verificado com sucesso! Você já pode acessar o painel.',
    })
  } catch (error) {
    console.error('[VERIFY_OTP]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao verificar código.' },
      { status: 500 }
    )
  }
}

