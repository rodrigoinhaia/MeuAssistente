/**
 * Webhook para receber mensagens do WhatsApp
 * Processa mensagens e retorna respostas
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { processWhatsAppMessage } from '@/lib/whatsapp/message-processor'
import { identifyUserByPhone, getUnregisteredUserMessage } from '@/lib/whatsapp/user-identification'

export async function POST(req: Request) {
  try {
    // Verificar autenticação (opcional, mas recomendado)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { status: 'error', message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()

    // Estrutura esperada:
    // {
    //   phoneNumber: string, // Número do remetente
    //   message: string,      // Texto da mensagem
    //   messageType?: 'text' | 'image' | 'audio',
    //   mediaUrl?: string,    // URL da mídia (se image ou audio)
    //   timestamp?: string,
    // }

    const { phoneNumber, message, messageType = 'text', mediaUrl } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { status: 'error', message: 'phoneNumber e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar se o usuário está cadastrado ANTES de processar
    const identification = await identifyUserByPhone(phoneNumber)
    
    if (!identification) {
      // Usuário não cadastrado - retornar mensagem informativa
      return NextResponse.json({
        status: 'success',
        response: getUnregisteredUserMessage(),
        requiresConfirmation: false,
        action: 'none',
        userRegistered: false,
      })
    }

    // TODO: Processar OCR se for imagem
    // TODO: Processar transcrição se for áudio
    // if (messageType === 'image' && mediaUrl) {
    //   const text = await processOCR(mediaUrl)
    //   message = text
    // }
    // if (messageType === 'audio' && mediaUrl) {
    //   const text = await transcribeAudio(mediaUrl)
    //   message = text
    // }

    // Processar mensagem
    const result = await processWhatsAppMessage(phoneNumber, message, messageType)

    // Retornar resposta
    return NextResponse.json({
      status: 'success',
      response: result.response,
      requiresConfirmation: result.requiresConfirmation,
      action: result.action,
    })
  } catch (error) {
    console.error('[WHATSAPP_WEBHOOK] Erro ao processar mensagem:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao processar mensagem',
        error: String(error),
      },
      { status: 500 }
    )
  }
}

