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
          console.log('[SEND_WHATSAPP] Mensagem enviada via Evolution API:', phoneNumber)
          return true
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('[SEND_WHATSAPP] Erro Evolution API:', errorData)
        }
      } catch (error) {
        console.error('[SEND_WHATSAPP] Erro ao enviar via Evolution API:', error)
      }
    }

    // Se nenhum método funcionou, logar para debug
    console.warn('[SEND_WHATSAPP] Nenhum método de envio configurado. Configure N8N_WHATSAPP_WEBHOOK_URL ou Evolution API.')
    return false
  } catch (error) {
    console.error('[SEND_WHATSAPP] Erro geral ao enviar mensagem:', error)
    return false
  }
}

