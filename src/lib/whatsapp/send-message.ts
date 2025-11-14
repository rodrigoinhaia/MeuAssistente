/**
 * Função para enviar mensagens via WhatsApp
 * Suporta N8N webhook ou Evolution API
 */

interface SendMessageOptions {
  phoneNumber: string
  message: string
  familyId?: string
}

/**
 * Envia mensagem via WhatsApp usando N8N webhook ou Evolution API
 */
export async function sendWhatsAppMessage(options: SendMessageOptions): Promise<boolean> {
  const { phoneNumber, message, familyId } = options

  try {
    // Usar Evolution API diretamente (configurado via variáveis de ambiente)
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

    if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
      try {
        // Normalizar número (remover caracteres especiais)
        const normalizedPhone = phoneNumber.replace(/\D/g, '')

        const response = await fetch(
          `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: normalizedPhone,
              text: message,
            }),
          }
        )

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}))
          console.log('[SEND_WHATSAPP] Mensagem enviada via Evolution API:', phoneNumber, responseData)
          return true
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('[SEND_WHATSAPP] Erro Evolution API:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            url: `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
            phone: normalizedPhone
          })
          throw new Error(`Evolution API retornou erro: ${response.status} - ${JSON.stringify(errorData)}`)
        }
      } catch (error: any) {
        console.error('[SEND_WHATSAPP] Erro ao enviar via Evolution API:', {
          message: error.message,
          stack: error.stack,
          url: `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
          phone: phoneNumber
        })
        throw error // Re-throw para que o erro seja capturado acima
      }
    }

    // Se nenhum método funcionou, logar para debug
    console.warn('[SEND_WHATSAPP] Nenhum método de envio configurado. Configure Evolution API.')
    console.warn('[SEND_WHATSAPP] Variáveis necessárias:', {
      EVOLUTION_API_URL: evolutionApiUrl ? '✅' : '❌',
      EVOLUTION_API_KEY: evolutionApiKey ? '✅' : '❌',
      EVOLUTION_INSTANCE_NAME: evolutionInstance ? '✅' : '❌',
    })
    throw new Error('Nenhum método de envio de WhatsApp configurado. Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE_NAME.')
  } catch (error: any) {
    console.error('[SEND_WHATSAPP] Erro geral ao enviar mensagem:', error)
    throw error // Re-throw para propagar o erro
  }
}

