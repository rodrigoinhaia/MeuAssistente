/**
 * Gerenciamento de Contexto de Sessão para WhatsApp
 * Armazena estado entre mensagens usando Redis
 */

import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'

export interface SessionContext {
  userId: string
  tenantId: string
  phoneNumber: string
  lastInteraction: Date
  pendingTransaction?: Partial<PendingTransaction>
  pendingAppointment?: Partial<PendingAppointment>
  awaitingConfirmation?: 'transaction' | 'appointment'
  lastJokeAt?: Date
  messageCount: number
}

export interface PendingTransaction {
  amount: number
  type: 'expense' | 'income'
  category?: string
  description?: string
  date?: Date
}

export interface PendingAppointment {
  title: string
  date: Date
  description?: string
  location?: string
}

const SESSION_TTL = 24 * 60 * 60 // 24 horas em segundos
const INACTIVITY_TTL = 30 * 60 // 30 minutos em segundos

/**
 * Obtém o contexto da sessão do usuário
 */
export async function getSessionContext(
  phoneNumber: string
): Promise<SessionContext | null> {
  try {
    const key = `session:${phoneNumber}`
    const data = await redis.get(key)

    if (!data) {
      return null
    }

    const context = JSON.parse(data) as SessionContext
    context.lastInteraction = new Date(context.lastInteraction)

    if (context.pendingTransaction) {
      // Converter datas se existirem
      if (context.pendingTransaction.date) {
        context.pendingTransaction.date = new Date(context.pendingTransaction.date)
      }
    }

    if (context.pendingAppointment) {
      context.pendingAppointment.date = new Date(context.pendingAppointment.date)
    }

    if (context.lastJokeAt) {
      context.lastJokeAt = new Date(context.lastJokeAt)
    }

    return context
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao obter contexto:', error)
    return null
  }
}

/**
 * Cria ou atualiza o contexto da sessão
 */
export async function setSessionContext(
  phoneNumber: string,
  context: Partial<SessionContext>
): Promise<void> {
  try {
    // Buscar contexto existente
    const existing = await getSessionContext(phoneNumber)
    const updated: SessionContext = {
      ...(existing || {
        userId: '',
        tenantId: '',
        phoneNumber,
        lastInteraction: new Date(),
        messageCount: 0,
      }),
      ...context,
      phoneNumber,
      lastInteraction: new Date(),
      messageCount: (existing?.messageCount || 0) + 1,
    }

    const key = `session:${phoneNumber}`
    await redis.setex(key, SESSION_TTL, JSON.stringify(updated))
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao salvar contexto:', error)
  }
}

/**
 * Inicializa o contexto da sessão identificando o usuário
 */
export async function initializeSessionContext(
  phoneNumber: string
): Promise<SessionContext | null> {
  try {
    // Usar a função de identificação de usuário
    const { identifyUserByPhone } = await import('./user-identification')
    const identification = await identifyUserByPhone(phoneNumber)

    if (!identification) {
      return null
    }

    const context: SessionContext = {
      userId: identification.userId,
      tenantId: identification.familyId,
      phoneNumber: identification.phoneNumber,
      lastInteraction: new Date(),
      messageCount: 0,
    }

    await setSessionContext(phoneNumber, context)
    return context
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao inicializar contexto:', error)
    return null
  }
}

/**
 * Limpa o contexto após confirmação ou cancelamento
 */
export async function clearPendingContext(
  phoneNumber: string,
  type: 'transaction' | 'appointment'
): Promise<void> {
  try {
    const context = await getSessionContext(phoneNumber)
    if (!context) return

    if (type === 'transaction') {
      delete context.pendingTransaction
    } else {
      delete context.pendingAppointment
    }

    delete context.awaitingConfirmation

    await setSessionContext(phoneNumber, context)
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao limpar contexto pendente:', error)
  }
}

/**
 * Limpa sessões inativas (mais de 30 minutos sem interação)
 */
export async function cleanupInactiveSessions(): Promise<void> {
  try {
    // Buscar todas as chaves de sessão
    const keys = await redis.keys('session:*')

    for (const key of keys) {
      const data = await redis.get(key)
      if (!data) continue

      const context = JSON.parse(data) as SessionContext
      const lastInteraction = new Date(context.lastInteraction)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastInteraction.getTime()) / (1000 * 60)

      // Se inativo por mais de 30 minutos, limpar contexto pendente
      if (diffMinutes > 30) {
        if (context.awaitingConfirmation) {
          await clearPendingContext(context.phoneNumber, context.awaitingConfirmation)
        }
      }
    }
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao limpar sessões inativas:', error)
  }
}

/**
 * Verifica se pode enviar piada (controle de frequência)
 */
export async function canSendJoke(phoneNumber: string): Promise<boolean> {
  try {
    const context = await getSessionContext(phoneNumber)
    if (!context) return true

    if (!context.lastJokeAt) return true

    const lastJoke = new Date(context.lastJokeAt)
    const now = new Date()
    const diffHours = (now.getTime() - lastJoke.getTime()) / (1000 * 60 * 60)

    // Permitir piada a cada 4 horas
    return diffHours >= 4
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao verificar piada:', error)
    return false
  }
}

/**
 * Marca que uma piada foi enviada
 */
export async function markJokeSent(phoneNumber: string): Promise<void> {
  try {
    await setSessionContext(phoneNumber, {
      lastJokeAt: new Date(),
    })
  } catch (error) {
    console.error('[SESSION_CONTEXT] Erro ao marcar piada:', error)
  }
}

