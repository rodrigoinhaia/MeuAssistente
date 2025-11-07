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
    const headersList = headers()
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
  // Exemplo de processamento:
  // - Extrair informações da mensagem
  // - Identificar intenção (criar transação, compromisso, etc.)
  // - Criar registro no banco

  // Por enquanto, apenas log
  console.log('[PROCESS_WHATSAPP]', { familyId, data })
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

