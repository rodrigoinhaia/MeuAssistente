import { NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send-message'

/**
 * POST - Rota de teste para envio de WhatsApp
 * Permite testar o envio e ver logs detalhados
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phoneNumber, message } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { status: 'error', message: 'Número de telefone é obrigatório' },
        { status: 400 }
      )
    }

    const testMessage = message || `🧪 *Teste MeuAssistente*\n\nEsta é uma mensagem de teste enviada em ${new Date().toLocaleString('pt-BR')}.\n\nSe você recebeu esta mensagem, o sistema está funcionando corretamente! ✅`

    // Normalizar número para teste
    let normalizedPhone = phoneNumber.replace(/\D/g, '')
    const phoneWithoutCountryCode = normalizedPhone.startsWith('55') 
      ? normalizedPhone.substring(2) 
      : normalizedPhone

    // Verificar variáveis de ambiente
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

    const config = {
      EVOLUTION_API_URL: evolutionApiUrl || '❌ NÃO CONFIGURADO',
      EVOLUTION_API_KEY: evolutionApiKey ? '✅ Configurado' : '❌ NÃO CONFIGURADO',
      EVOLUTION_INSTANCE_NAME: evolutionInstance || '❌ NÃO CONFIGURADO',
    }

    console.log('[TEST_WHATSAPP] Iniciando teste de envio...')
    console.log('[TEST_WHATSAPP] Configuração:', config)
    console.log('[TEST_WHATSAPP] Número original:', phoneNumber)
    console.log('[TEST_WHATSAPP] Número com código do país (55):', normalizedPhone)
    console.log('[TEST_WHATSAPP] Número sem código do país:', phoneWithoutCountryCode)
    console.log('[TEST_WHATSAPP] Mensagem:', testMessage.substring(0, 100))
    console.log('[TEST_WHATSAPP] O sistema tentará ambos os formatos automaticamente')

    try {
      const result = await sendWhatsAppMessage({
        phoneNumber,
        message: testMessage,
      })

      if (result) {
        console.log('[TEST_WHATSAPP] ✅ Mensagem enviada com sucesso!')
        return NextResponse.json({
          status: 'ok',
          message: 'Mensagem enviada com sucesso!',
          config,
          phoneNumber,
        })
      } else {
        console.error('[TEST_WHATSAPP] ❌ Falha ao enviar mensagem')
        return NextResponse.json({
          status: 'error',
          message: 'Falha ao enviar mensagem. Verifique os logs do servidor.',
          config,
          phoneNumber,
        }, { status: 500 })
      }
    } catch (error: any) {
      console.error('[TEST_WHATSAPP] ❌ Erro capturado:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })

      return NextResponse.json({
        status: 'error',
        message: error.message || 'Erro ao enviar mensagem',
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        config,
        phoneNumber,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[TEST_WHATSAPP] Erro geral:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao processar requisição',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Mostra status da configuração
 */
export async function GET() {
  const evolutionApiUrl = process.env.EVOLUTION_API_URL
  const evolutionApiKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

  return NextResponse.json({
    status: 'ok',
    config: {
      EVOLUTION_API_URL: evolutionApiUrl ? '✅ Configurado' : '❌ NÃO CONFIGURADO',
      EVOLUTION_API_KEY: evolutionApiKey ? '✅ Configurado' : '❌ NÃO CONFIGURADO',
      EVOLUTION_INSTANCE_NAME: evolutionInstance ? '✅ Configurado' : '❌ NÃO CONFIGURADO',
    },
    url: evolutionApiUrl ? `${evolutionApiUrl}/message/sendText/${evolutionInstance}` : null,
  })
}

