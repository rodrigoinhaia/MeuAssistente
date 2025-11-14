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
        let normalizedPhone = phoneNumber.replace(/\D/g, '')
        
        // Remover código do país (55) se presente no início
        // Isso permite testar com e sem código do país
        const phoneWithoutCountryCode = normalizedPhone.startsWith('55') 
          ? normalizedPhone.substring(2) 
          : normalizedPhone
        
        // Tentar primeiro com código do país, depois sem
        const phoneVariants = [
          normalizedPhone, // Com código do país (55...)
          phoneWithoutCountryCode, // Sem código do país
        ]
        
        const apiUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstance}`
        
        console.log('[SEND_WHATSAPP] Enviando requisição:', {
          url: apiUrl,
          phoneOriginal: phoneNumber,
          phoneWithCountryCode: normalizedPhone,
          phoneWithoutCountryCode: phoneWithoutCountryCode,
          messageLength: message.length,
          instance: evolutionInstance,
        })
        
        // Tentar primeiro com código do país
        let lastError: any = null
        for (const phoneToTry of phoneVariants) {
          const requestBody = {
            number: phoneToTry,
            text: message,
          }
          
          console.log(`[SEND_WHATSAPP] Tentando enviar para: ${phoneToTry} (${phoneToTry.length} dígitos)`)

          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'apikey': evolutionApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })
            
            console.log(`[SEND_WHATSAPP] Resposta recebida para ${phoneToTry}:`, {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            })

            if (response.ok) {
              const responseData = await response.json().catch(() => {
                // Se não conseguir fazer parse do JSON, tentar texto
                return response.text().catch(() => ({}))
              })
              
              // Verificar se a mensagem foi realmente enviada
              const status = (responseData as any)?.status
              const messageId = (responseData as any)?.key?.id
              
              console.log('[SEND_WHATSAPP] ✅ Mensagem enviada via Evolution API:', {
                phoneUsed: phoneToTry,
                phoneOriginal: phoneNumber,
                status: status || 'N/A',
                messageId: messageId || 'N/A',
                response: responseData,
              })
              
              // Status pode ser: PENDING, SENT, DELIVERED, READ, FAILED
              if (status === 'FAILED') {
                console.error('[SEND_WHATSAPP] ⚠️ Mensagem falhou:', responseData)
                // Continuar tentando próximo formato se disponível
                if (phoneToTry !== phoneVariants[phoneVariants.length - 1]) {
                  console.log(`[SEND_WHATSAPP] Tentando próximo formato devido a status FAILED...`)
                  continue
                }
                throw new Error(`Mensagem falhou ao ser enviada. Status: ${status}`)
              }
              
              // Avisar se status é PENDING (mensagem aceita mas pode não ter sido entregue)
              if (status === 'PENDING') {
                console.warn('[SEND_WHATSAPP] ⚠️ Status PENDING - Mensagem aceita mas pode não ter sido entregue ainda')
                console.warn('[SEND_WHATSAPP] Verifique se:')
                console.warn('   - O número está na lista de contatos da instância')
                console.warn('   - A instância está totalmente conectada')
                console.warn('   - O WhatsApp está sincronizado')
              }
              
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
              
              lastError = {
                phone: phoneToTry,
                status: response.status,
                statusText: response.statusText,
                error: errorData,
              }
              
              console.log(`[SEND_WHATSAPP] ⚠️ Falha com ${phoneToTry}:`, {
                status: response.status,
                error: errorData,
              })
              
              // Se não for o último formato, continuar tentando
              if (phoneToTry !== phoneVariants[phoneVariants.length - 1]) {
                console.log(`[SEND_WHATSAPP] Tentando próximo formato...`)
                continue
              }
              
              // Se chegou aqui, todas as tentativas falharam
              console.error('[SEND_WHATSAPP] ❌ Todas as tentativas falharam:', {
                attempts: phoneVariants.map(p => ({ phone: p, error: lastError })),
                url: apiUrl,
                phoneOriginal: phoneNumber,
              })
              
              const errorMessage = errorData.message || errorData.error || errorData.raw || 'Erro desconhecido'
              throw new Error(`Evolution API retornou erro ${response.status} para ${phoneToTry}: ${errorMessage}`)
            }
          } catch (fetchError: any) {
            lastError = {
              phone: phoneToTry,
              error: fetchError.message,
            }
            
            // Se não for o último formato, continuar tentando
            if (phoneToTry !== phoneVariants[phoneVariants.length - 1]) {
              console.log(`[SEND_WHATSAPP] Erro de rede com ${phoneToTry}, tentando próximo formato...`)
              continue
            }
            
            // Se chegou aqui, todas as tentativas falharam
            throw fetchError
          }
        }
        
        // Se chegou aqui sem retornar, todas as tentativas falharam
        throw new Error(`Não foi possível enviar mensagem. Último erro: ${JSON.stringify(lastError)}`)
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

