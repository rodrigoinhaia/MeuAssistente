import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/authOptions'
import { verifyOTP } from '@/lib/otp'

/**
 * POST - Verificar código OTP
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { status: 'error', message: 'Você precisa estar autenticado para verificar o código.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { status: 'error', message: 'Código é obrigatório.' },
        { status: 400 }
      )
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

