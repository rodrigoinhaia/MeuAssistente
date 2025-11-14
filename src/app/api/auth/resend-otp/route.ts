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
    let body: any
    try {
      body = await req.json()
    } catch (parseError: any) {
      console.error('[RESEND_OTP] Erro ao fazer parse do body:', parseError)
      return NextResponse.json(
        { status: 'error', message: 'Erro ao processar requisição.' },
        { status: 400 }
      )
    }

    const { userId: targetUserId } = body

    // Se userId foi fornecido, é admin reenviando para outro usuário
    let userId: string
    let session: any
    
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      console.error('[RESEND_OTP] Erro ao obter sessão:', sessionError)
      return NextResponse.json(
        { status: 'error', message: 'Erro ao verificar autenticação.' },
        { status: 500 }
      )
    }

    if (targetUserId) {
      // Verificar se é admin
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
      if (!session?.user) {
        return NextResponse.json(
          { status: 'error', message: 'Você precisa estar autenticado para solicitar um novo código.' },
          { status: 401 }
        )
      }
      userId = (session.user as any)?.id
      
      if (!userId) {
        console.error('[RESEND_OTP] UserId não encontrado na sessão:', session)
        return NextResponse.json(
          { status: 'error', message: 'Erro ao identificar usuário.' },
          { status: 500 }
        )
      }
    }

    // Buscar usuário para obter telefone
    let user: any
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, isVerified: true, email: true, name: true },
      })
    } catch (dbError: any) {
      console.error('[RESEND_OTP] Erro ao buscar usuário no banco:', {
        error: dbError.message,
        userId,
      })
      return NextResponse.json(
        { status: 'error', message: 'Erro ao buscar dados do usuário.' },
        { status: 500 }
      )
    }

    if (!user) {
      console.error('[RESEND_OTP] Usuário não encontrado:', userId)
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

    if (!user.phone || user.phone === '00000000000') {
      return NextResponse.json(
        { status: 'error', message: 'Telefone não cadastrado.' },
        { status: 400 }
      )
    }

    // Validar formato do telefone
    const phoneDigits = user.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      console.error('[RESEND_OTP] Telefone inválido:', user.phone)
      return NextResponse.json(
        { status: 'error', message: 'Telefone inválido. Entre em contato com o administrador.' },
        { status: 400 }
      )
    }

    console.log('[RESEND_OTP] 📤 Preparando envio de código:', {
      userId,
      userEmail: user.email,
      userName: user.name,
      phone: user.phone,
      phoneDigits: phoneDigits.length,
      isVerified: user.isVerified,
    })

    // Gerar e enviar novo código
    try {
      console.log('[RESEND_OTP] 🔄 Chamando createAndSendOTP...')
      const otpCode = await createAndSendOTP(userId, user.phone)
      
      console.log('[RESEND_OTP] ✅ Código enviado com sucesso:', {
        userId,
        phone: user.phone,
        codeLength: otpCode?.length || 'N/A',
      })
      
      return NextResponse.json({
        status: 'ok',
        message: 'Novo código enviado para seu WhatsApp!',
      })
    } catch (otpError: any) {
      console.error('[RESEND_OTP] ❌ Erro ao criar/enviar OTP:', {
        message: otpError.message,
        stack: otpError.stack,
        name: otpError.name,
        code: otpError.code,
        userId,
        userEmail: user.email,
        phone: user.phone,
        phoneDigits: phoneDigits.length,
        fullError: JSON.stringify(otpError, Object.getOwnPropertyNames(otpError)),
      })
      
      // Verificar se é erro de configuração do WhatsApp
      const isConfigError = otpError.message?.includes('configurado') || 
                           otpError.message?.includes('EVOLUTION') ||
                           otpError.message?.includes('Nenhum método') ||
                           otpError.message?.includes('WhatsApp') ||
                           otpError.message?.includes('whatsapp')
      
      // Verificar se é erro de banco de dados
      const isDbError = otpError.message?.includes('Prisma') ||
                       otpError.message?.includes('database') ||
                       otpError.message?.includes('Unique constraint') ||
                       otpError.code === 'P2002' ||
                       otpError.code === 'P2003'
      
      let errorMessage = 'Erro ao enviar código. Tente novamente em alguns instantes.'
      if (isConfigError) {
        errorMessage = 'WhatsApp não está configurado. Entre em contato com o administrador.'
      } else if (isDbError) {
        errorMessage = 'Erro ao processar solicitação. Tente novamente.'
      }
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            message: otpError.message,
            type: otpError.name,
            code: otpError.code,
          } : undefined
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[RESEND_OTP] ❌ Erro geral:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      cause: error.cause,
      fullError: error,
    })
    
    // Log mais detalhado em produção também (sem expor stack completo)
    const errorDetails = {
      message: error.message || 'Erro desconhecido',
      type: error.name || 'Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      }),
    }
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro ao reenviar código. Tente novamente em alguns instantes.',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

