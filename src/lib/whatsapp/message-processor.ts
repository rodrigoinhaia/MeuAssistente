/**
 * Processador Principal de Mensagens do WhatsApp
 * Orquestra todo o fluxo: detecção de intent → confirmação → salvamento
 */

import { detectIntent, IntentResult } from './intent-detection'
import {
  getSessionContext,
  initializeSessionContext,
  setSessionContext,
  canSendJoke,
  markJokeSent,
} from './session-context'
import {
  savePendingTransaction,
  savePendingAppointment,
  createTransactionConfirmationMessage,
  createAppointmentConfirmationMessage,
  confirmTransaction,
  confirmAppointment,
  cancelPending,
} from './confirmation-flow'
import { extractDateTime, formatDateForDisplay } from './date-parser'
import { getRandomJoke, shouldIncludeJoke } from './jokes'
import { generateWeeklySummary } from './weekly-summary'
import {
  identifyUserByPhone,
  getUnregisteredUserMessage,
  getFamilyOwnerInfo,
} from './user-identification'
import { prisma } from '@/lib/db'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ProcessedMessage {
  response: string
  requiresConfirmation: boolean
  action?: 'transaction' | 'appointment' | 'report' | 'none'
}

/**
 * Processa mensagem do WhatsApp
 */
export async function processWhatsAppMessage(
  phoneNumber: string,
  message: string,
  messageType?: 'text' | 'image' | 'audio'
): Promise<ProcessedMessage> {
  try {
    // Primeiro, verificar se o usuário está cadastrado
    const identification = await identifyUserByPhone(phoneNumber)
    
    if (!identification) {
      // Usuário não cadastrado - retornar mensagem informativa
      return {
        response: getUnregisteredUserMessage(),
        requiresConfirmation: false,
        action: 'none',
      }
    }

    // Verificar se a família está ativa
    if (!identification.isActive) {
      return {
        response: '❌ Sua conta está inativa. Entre em contato com o suporte para reativar.',
        requiresConfirmation: false,
        action: 'none',
      }
    }

    // Inicializar contexto se não existir
    let context = await getSessionContext(phoneNumber)
    if (!context) {
      context = await initializeSessionContext(phoneNumber)
      if (!context) {
        // Se ainda não conseguiu inicializar, mas o usuário existe, tentar novamente
        const retryIdentification = await identifyUserByPhone(phoneNumber)
        if (retryIdentification) {
          // Criar contexto manualmente
          context = {
            userId: retryIdentification.userId,
            tenantId: retryIdentification.familyId,
            phoneNumber: retryIdentification.phoneNumber,
            lastInteraction: new Date(),
            messageCount: 0,
          }
          await setSessionContext(phoneNumber, context)
        } else {
          return {
            response: getUnregisteredUserMessage(),
            requiresConfirmation: false,
            action: 'none',
          }
        }
      }
    }

    // Validar se o contexto ainda está válido (usuário pode ter sido removido)
    if (context.userId && context.tenantId) {
      const currentIdentification = await identifyUserByPhone(phoneNumber)
      if (!currentIdentification || currentIdentification.userId !== context.userId) {
        // Usuário foi removido ou alterado - retornar mensagem
        return {
          response: getUnregisteredUserMessage(),
          requiresConfirmation: false,
          action: 'none',
        }
      }
    }

    // Se há confirmação pendente, processar resposta
    if (context.awaitingConfirmation) {
      return await handleConfirmationResponse(phoneNumber, message, context.awaitingConfirmation)
    }

    // Detectar intent
    const intent = await detectIntent(message)

    // Processar baseado no intent
    switch (intent.type) {
      case 'expense':
      case 'income':
        return await handleTransactionIntent(phoneNumber, intent, context)

      case 'appointment':
        return await handleAppointmentIntent(phoneNumber, intent, context)

      case 'report':
        return await handleReportIntent(context)

      case 'confirmation':
      case 'cancel':
      case 'edit':
        return {
          response: 'Não há nada pendente para confirmar. Como posso ajudar?',
          requiresConfirmation: false,
          action: 'none',
        }

      default:
        return {
          response: 'Olá! 👋 Como posso ajudar?\n\nVocê pode:\n💰 Registrar despesas\n💸 Registrar receitas\n📅 Agendar compromissos\n📊 Ver relatórios',
          requiresConfirmation: false,
          action: 'none',
        }
    }
  } catch (error) {
    console.error('[MESSAGE_PROCESSOR] Erro ao processar mensagem:', error)
    return {
      response: '❌ Ops! Algo deu errado. Tente novamente em alguns instantes.',
      requiresConfirmation: false,
      action: 'none',
    }
  }
}

/**
 * Processa resposta de confirmação
 */
async function handleConfirmationResponse(
  phoneNumber: string,
  message: string,
  type: 'transaction' | 'appointment'
): Promise<ProcessedMessage> {
  const lowerMessage = message.toLowerCase().trim()

  // Confirmar
  if (lowerMessage === 'confirmar' || lowerMessage === 'sim' || lowerMessage === 'ok') {
    if (type === 'transaction') {
      const result = await confirmTransaction(phoneNumber)
      return {
        response: result.message,
        requiresConfirmation: false,
        action: 'transaction',
      }
    } else {
      const result = await confirmAppointment(phoneNumber)
      return {
        response: result.message,
        requiresConfirmation: false,
        action: 'appointment',
      }
    }
  }

  // Cancelar
  if (lowerMessage === 'cancelar' || lowerMessage === 'não' || lowerMessage === 'nao') {
    const response = await cancelPending(phoneNumber, type)
    return {
      response,
      requiresConfirmation: false,
      action: 'none',
    }
  }

  // Editar (por enquanto, apenas cancelar e pedir para refazer)
  if (lowerMessage === 'editar' || lowerMessage === 'alterar') {
    await cancelPending(phoneNumber, type)
    return {
      response: '✏️ Operação cancelada. Por favor, envie novamente as informações corretas.',
      requiresConfirmation: false,
      action: 'none',
    }
  }

  // Resposta não reconhecida
  return {
    response: '❓ Não entendi. Por favor, escolha uma opção:\n✅ Confirmar | ✏️ Editar | ❌ Cancelar',
    requiresConfirmation: true,
    action: type,
  }
}

/**
 * Processa intent de transação
 */
async function handleTransactionIntent(
  phoneNumber: string,
  intent: IntentResult,
  context: any
): Promise<ProcessedMessage> {
  const extracted = intent.extractedData

  if (!extracted || !extracted.amount) {
    return {
      response: '💰 Para registrar uma transação, preciso do valor.\n\nExemplo: "Gastei R$ 50 no restaurante"',
      requiresConfirmation: false,
      action: 'transaction',
    }
  }

  const transaction = {
    amount: extracted.amount,
    type: intent.type === 'expense' ? ('expense' as const) : ('income' as const),
    category: extracted.category,
    description: extracted.description || 'Sem descrição',
    date: extracted.date || new Date(),
  }

  // Salvar como pendente
  await savePendingTransaction(phoneNumber, transaction)

  // Criar mensagem de confirmação
  let response = createTransactionConfirmationMessage(transaction)

  // Adicionar piada (33% de chance, se permitido)
  if (shouldIncludeJoke() && (await canSendJoke(phoneNumber))) {
    const joke = getRandomJoke(transaction.type)
    response += `\n\n${joke}`
    await markJokeSent(phoneNumber)
  }

  return {
    response,
    requiresConfirmation: true,
    action: 'transaction',
  }
}

/**
 * Processa intent de compromisso
 */
async function handleAppointmentIntent(
  phoneNumber: string,
  intent: IntentResult,
  context: any
): Promise<ProcessedMessage> {
  const extracted = intent.extractedData

  if (!extracted || !extracted.title) {
    return {
      response: '📅 Para agendar um compromisso, preciso do título e data.\n\nExemplo: "Agendar reunião dia 20/09 às 15h"',
      requiresConfirmation: false,
      action: 'appointment',
    }
  }

  // Tentar extrair data/hora
  const dateTime = extracted.date
    ? { date: extracted.date, time: extracted.time }
    : null

  if (!dateTime || !dateTime.date) {
    return {
      response: '📅 Preciso de uma data para agendar. Exemplo: "Agendar reunião dia 20/09 às 15h"',
      requiresConfirmation: false,
      action: 'appointment',
    }
  }

  const appointment = {
    title: extracted.title || extracted.description || 'Compromisso',
    date: dateTime.date,
    description: extracted.description,
    location: undefined,
  }

  // Salvar como pendente
  await savePendingAppointment(phoneNumber, appointment)

  // Criar mensagem de confirmação
  const response = createAppointmentConfirmationMessage(appointment)

  return {
    response,
    requiresConfirmation: true,
    action: 'appointment',
  }
}

/**
 * Processa intent de relatório
 */
async function handleReportIntent(context: any): Promise<ProcessedMessage> {
  try {
    const summary = await generateWeeklySummary(context.userId, context.tenantId)
    return {
      response: summary,
      requiresConfirmation: false,
      action: 'report',
    }
  } catch (error) {
    console.error('[MESSAGE_PROCESSOR] Erro ao gerar relatório:', error)
    return {
      response: '❌ Erro ao gerar relatório. Tente novamente mais tarde.',
      requiresConfirmation: false,
      action: 'report',
    }
  }
}

