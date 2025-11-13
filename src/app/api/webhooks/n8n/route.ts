import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

/**
 * Webhook endpoint para receber dados do N8N
 * Este endpoint é chamado pelos workflows do N8N quando processam mensagens ou eventos
 */
export async function POST(req: Request) {
  try {
    // Verificar autenticação do webhook (opcional, mas recomendado)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET

    // Se houver secret configurado, validar
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { status: 'error', message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()

    // Estrutura esperada do webhook:
    // {
    //   workflowId: string,
    //   workflowName: string,
    //   familyId?: string,
    //   phoneNumber?: string, // Para identificar a família
    //   type: 'whatsapp' | 'google_calendar' | 'google_tasks' | 'ai',
    //   data: any,
    //   status: 'success' | 'error',
    //   message?: string,
    // }

    const {
      workflowId,
      workflowName,
      familyId,
      phoneNumber,
      type,
      data,
      status,
      message,
    } = body

    // Se não tiver familyId, tentar identificar por phoneNumber
    let finalFamilyId = familyId

    if (!finalFamilyId && phoneNumber) {
      const family = await prisma.family.findUnique({
        where: { phoneNumber },
        select: { id: true },
      })

      if (family) {
        finalFamilyId = family.id
      }
    }

    // Se ainda não tiver familyId, não podemos processar
    if (!finalFamilyId) {
      console.warn('[N8N_WEBHOOK] FamilyId não encontrado', { phoneNumber, workflowId })
      return NextResponse.json({
        status: 'ok',
        message: 'FamilyId não encontrado, mas webhook recebido',
      })
    }

    // Criar log de processamento
    await prisma.processingLog.create({
      data: {
        familyId: finalFamilyId,
        type: type || 'unknown',
        message: message || `Workflow ${workflowName} executado`,
        data: data || {},
        status: status || 'success',
      },
    })

    // Atualizar último execution do workflow se existir
    if (workflowId) {
      const workflow = await prisma.n8NWorkflow.findFirst({
        where: { workflowId },
      })

      if (workflow) {
        await prisma.n8NWorkflow.update({
          where: { id: workflow.id },
          data: {
            lastExecution: new Date(),
            status: status === 'error' ? 'error' : 'active',
          },
        })
      }
    }

    // Processar dados específicos por tipo
    if (type === 'whatsapp' && data) {
      // Processar mensagem do WhatsApp
      // Exemplo: criar transação, compromisso, tarefa baseado na mensagem
      await processWhatsAppMessage(finalFamilyId, data)
    } else if (type === 'google_calendar' && data) {
      // Processar evento do Google Calendar
      await processGoogleCalendarEvent(finalFamilyId, data)
    } else if (type === 'google_tasks' && data) {
      // Processar tarefa do Google Tasks
      await processGoogleTask(finalFamilyId, data)
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Webhook processado com sucesso',
    })
  } catch (error) {
    console.error('[N8N_WEBHOOK_ERROR]', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao processar webhook',
        error: String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Processa mensagem do WhatsApp
 */
async function processWhatsAppMessage(familyId: string, data: any) {
  try {
    // Buscar família para obter phoneNumber
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { phoneNumber: true },
    })

    if (!family) {
      console.error('[PROCESS_WHATSAPP] Família não encontrada:', familyId)
      return
    }

    // Estrutura esperada do N8N:
    // {
    //   phoneNumber?: string,
    //   message: string,
    //   messageType?: 'text' | 'image' | 'audio',
    //   mediaUrl?: string,
    // }

    const phoneNumber = data.phoneNumber || family.phoneNumber
    const message = data.message || ''
    const messageType = data.messageType || 'text'

    if (!message) {
      console.warn('[PROCESS_WHATSAPP] Mensagem vazia recebida')
      return
    }

    // Validar se o usuário está cadastrado ANTES de processar
    const { identifyUserByPhone, getUnregisteredUserMessage } = await import(
      '@/lib/whatsapp/user-identification'
    )
    const identification = await identifyUserByPhone(phoneNumber)

    if (!identification) {
      // Usuário não cadastrado - retornar mensagem informativa
      return {
        success: true,
        response: getUnregisteredUserMessage(),
        requiresConfirmation: false,
        action: 'none',
        userRegistered: false,
      }
    }

    // Processar mensagem usando o novo processador
    const { processWhatsAppMessage } = await import('@/lib/whatsapp/message-processor')
    const result = await processWhatsAppMessage(phoneNumber, message, messageType)

    // TODO: Enviar resposta via WhatsApp
    // Por enquanto, apenas log
    console.log('[PROCESS_WHATSAPP] Resposta gerada:', {
      phoneNumber,
      response: result.response,
      requiresConfirmation: result.requiresConfirmation,
    })

    // Retornar resultado para o N8N processar e enviar
    return {
      success: true,
      response: result.response,
      requiresConfirmation: result.requiresConfirmation,
      action: result.action,
    }
  } catch (error) {
    console.error('[PROCESS_WHATSAPP] Erro ao processar:', error)
    throw error
  }
}

/**
 * Processa evento do Google Calendar
 */
async function processGoogleCalendarEvent(familyId: string, data: any) {
  // Exemplo de processamento:
  // - Sincronizar evento do Google Calendar
  // - Criar/atualizar compromisso no banco

  // Por enquanto, apenas log
  console.log('[PROCESS_GOOGLE_CALENDAR]', { familyId, data })
}

/**
 * Processa tarefa do Google Tasks
 */
async function processGoogleTask(familyId: string, data: any) {
  // Exemplo de processamento:
  // - Sincronizar tarefa do Google Tasks
  // - Criar/atualizar tarefa no banco

  // Por enquanto, apenas log
  console.log('[PROCESS_GOOGLE_TASKS]', { familyId, data })
}

