import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { createAndSendOTP } from '@/lib/otp'

/**
 * POST - Reenviar código OTP
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { status: 'error', message: 'Você precisa estar autenticado para solicitar um novo código.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id

    // Buscar usuário para obter telefone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, isVerified: true },
    })

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { status: 'error', message: 'Seu WhatsApp já está verificado.' },
        { status: 400 }
      )
    }

    if (!user.phone) {
      return NextResponse.json(
        { status: 'error', message: 'Telefone não cadastrado.' },
        { status: 400 }
      )
    }

    // Gerar e enviar novo código
    await createAndSendOTP(userId, user.phone)

    return NextResponse.json({
      status: 'ok',
      message: 'Novo código enviado para seu WhatsApp!',
    })
  } catch (error) {
    console.error('[RESEND_OTP]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao reenviar código.' },
      { status: 500 }
    )
  }
}

