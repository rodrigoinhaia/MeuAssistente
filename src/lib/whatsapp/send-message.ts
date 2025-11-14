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
        
        const apiUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstance}`
        const requestBody = {
          number: normalizedPhone,
          text: message,
        }
        
        console.log('[SEND_WHATSAPP] Enviando requisição:', {
          url: apiUrl,
          phone: normalizedPhone,
          phoneOriginal: phoneNumber,
          messageLength: message.length,
          instance: evolutionInstance,
        })

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
        
        console.log('[SEND_WHATSAPP] Resposta recebida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        })

        if (response.ok) {
          const responseData = await response.json().catch(() => {
            // Se não conseguir fazer parse do JSON, tentar texto
            return response.text().catch(() => ({}))
          })
          console.log('[SEND_WHATSAPP] ✅ Mensagem enviada via Evolution API:', {
            phone: phoneNumber,
            normalizedPhone,
            response: responseData,
          })
          return true
        } else {
          // Tentar ler o corpo da resposta como JSON primeiro
          let errorData: any = {}
          const contentType = response.headers.get('content-type')
          
          try {
            if (contentType?.includes('application/json')) {
              errorData = await response.json()
            } else {
              const textData = await response.text()
              errorData = { message: textData, raw: textData }
            }
          } catch (parseError) {
            errorData = { 
              message: `Erro ao ler resposta: ${parseError}`,
              status: response.status,
              statusText: response.statusText,
            }
          }
          
          console.error('[SEND_WHATSAPP] ❌ Erro Evolution API:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            url: apiUrl,
            phone: normalizedPhone,
            phoneOriginal: phoneNumber,
            requestBody,
          })
          
          const errorMessage = errorData.message || errorData.error || errorData.raw || 'Erro desconhecido'
          throw new Error(`Evolution API retornou erro ${response.status}: ${errorMessage}`)
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

