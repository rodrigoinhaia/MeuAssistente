import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAndSendOTP } from '@/lib/otp'

/**
 * POST - Reenviar código OTP (rota pública - para usuários não autenticados)
 * Usa email para identificar o usuário
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { status: 'error', message: 'E-mail é obrigatório.' },
        { status: 400 }
      )
    }

    // Buscar usuário por email
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase().trim(),
      },
      select: { 
        id: true,
        phone: true, 
        isVerified: true,
        email: true,
      },
    })

    if (!user) {
      // Não revelar se o email existe ou não por segurança
      return NextResponse.json({
        status: 'ok',
        message: 'Se o e-mail estiver cadastrado, um código será enviado para o WhatsApp.',
      })
    }

    if (user.isVerified) {
      return NextResponse.json(
        { status: 'error', message: 'Seu WhatsApp já está verificado.' },
        { status: 400 }
      )
    }

    if (!user.phone || user.phone === '00000000000') {
      return NextResponse.json(
        { status: 'error', message: 'Telefone não cadastrado. Entre em contato com o administrador.' },
        { status: 400 }
      )
    }

    // Gerar e enviar novo código
    await createAndSendOTP(user.id, user.phone)

    return NextResponse.json({
      status: 'ok',
      message: 'Novo código enviado para seu WhatsApp!',
    })
  } catch (error) {
    console.error('[RESEND_OTP_PUBLIC]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao reenviar código.' },
      { status: 500 }
    )
  }
}

