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
    const body = await req.json()
    const { userId: targetUserId } = body

    // Se userId foi fornecido, é admin reenviando para outro usuário
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
          { status: 'error', message: 'Apenas admins podem reenviar códigos para outros usuários.' },
          { status: 403 }
        )
      }
      userId = targetUserId
    } else {
      // Usuário reenviando para si mesmo
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { status: 'error', message: 'Você precisa estar autenticado para solicitar um novo código.' },
          { status: 401 }
        )
      }
      userId = (session.user as any)?.id
    }

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
    try {
      await createAndSendOTP(userId, user.phone)
      
      return NextResponse.json({
        status: 'ok',
        message: 'Novo código enviado para seu WhatsApp!',
      })
    } catch (otpError: any) {
      console.error('[RESEND_OTP] Erro ao criar/enviar OTP:', otpError)
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Erro ao enviar código. Verifique se o WhatsApp está configurado corretamente.',
          details: process.env.NODE_ENV === 'development' ? otpError.message : undefined
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[RESEND_OTP] Erro geral:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro ao reenviar código.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

