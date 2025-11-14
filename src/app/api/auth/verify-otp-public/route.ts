import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyOTP } from '@/lib/otp'
import bcrypt from 'bcryptjs'

/**
 * POST - Verificar código OTP (rota pública - para usuários não autenticados)
 * Usa email e senha para validar antes de verificar
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, email, password } = body

    if (!code || !email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Código, e-mail e senha são obrigatórios.' },
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
        password: true,
        isVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'E-mail ou senha inválidos.' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { status: 'error', message: 'E-mail ou senha inválidos.' },
        { status: 401 }
      )
    }

    // Verificar código OTP
    const isValid = await verifyOTP(user.id, code)

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
    console.error('[VERIFY_OTP_PUBLIC]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao verificar código.' },
      { status: 500 }
    )
  }
}

