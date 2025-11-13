/**
 * Rota para enviar mensagens via WhatsApp
 * Pode ser chamada pelo N8N ou diretamente
 * 
 * POST /api/whatsapp/send
 * Body: { phoneNumber: string, message: string, familyId?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send-message'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneNumber, message, familyId } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { status: 'error', message: 'phoneNumber e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Enviar mensagem
    const success = await sendWhatsAppMessage({
      phoneNumber,
      message,
      familyId,
    })

    if (success) {
      return NextResponse.json({
        status: 'ok',
        message: 'Mensagem enviada com sucesso',
      })
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Erro ao enviar mensagem. Verifique a configuração do WhatsApp.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[WHATSAPP_SEND] Erro:', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao processar requisição', error: String(error) },
      { status: 500 }
    )
  }
}

