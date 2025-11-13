/**
 * Fluxo de Confirmação em 2 Etapas
 * NUNCA salva sem confirmação do usuário
 */

import { prisma } from '@/lib/db'
import {
  getSessionContext,
  setSessionContext,
  clearPendingContext,
  PendingTransaction,
  PendingAppointment,
} from './session-context'
import { formatDateForDisplay } from './date-parser'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Cria mensagem de confirmação para transação
 */
export function createTransactionConfirmationMessage(
  transaction: PendingTransaction
): string {
  const amount = transaction.amount || 0
  const type = transaction.type === 'expense' ? 'Despesa' : 'Receita'
  const category = transaction.category || 'Não categorizado'
  const description = transaction.description || 'Sem descrição'
  const date = transaction.date
    ? formatDateForDisplay(transaction.date)
    : format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  return `✅ *Entendi! Confirmar:*

💰 *${type}*: R$ ${amount.toFixed(2).replace('.', ',')}
🏷 *Categoria*: ${category}
📅 *Data*: ${date}
📝 *Descrição*: ${description}

*Escolha uma opção:*
✅ Confirmar | ✏️ Editar | ❌ Cancelar`
}

/**
 * Cria mensagem de confirmação para compromisso
 */
export function createAppointmentConfirmationMessage(
  appointment: PendingAppointment
): string {
  const date = formatDateForDisplay(appointment.date)
  const location = appointment.location ? `\n📍 *Local*: ${appointment.location}` : ''

  return `✅ *Entendi! Confirmar:*

📅 *Compromisso*: ${appointment.title}
🕐 *Data/Hora*: ${date}${location}
${appointment.description ? `📝 *Descrição*: ${appointment.description}` : ''}

*Escolha uma opção:*
✅ Confirmar | ✏️ Editar | ❌ Cancelar`
}

/**
 * Salva transação pendente no contexto
 */
export async function savePendingTransaction(
  phoneNumber: string,
  transaction: PendingTransaction
): Promise<void> {
  await setSessionContext(phoneNumber, {
    pendingTransaction: transaction,
    awaitingConfirmation: 'transaction',
  })
}

/**
 * Salva compromisso pendente no contexto
 */
export async function savePendingAppointment(
  phoneNumber: string,
  appointment: PendingAppointment
): Promise<void> {
  await setSessionContext(phoneNumber, {
    pendingAppointment: appointment,
    awaitingConfirmation: 'appointment',
  })
}

/**
 * Confirma e salva transação no banco
 */
export async function confirmTransaction(phoneNumber: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const context = await getSessionContext(phoneNumber)

    if (!context || !context.pendingTransaction) {
      return {
        success: false,
        message: 'Não há transação pendente para confirmar.',
      }
    }

    const { pendingTransaction, userId, tenantId } = context

    // Criar transação no banco
    const transaction = await prisma.transaction.create({
      data: {
        familyId: tenantId,
        userId,
        amount: pendingTransaction.amount || 0,
        type: pendingTransaction.type === 'expense' ? 'expense' : 'income',
        description: pendingTransaction.description || '',
        date: pendingTransaction.date || new Date(),
        categoryId: pendingTransaction.category
          ? await getCategoryId(tenantId, pendingTransaction.category)
          : null,
      },
    })

    // Limpar contexto pendente
    await clearPendingContext(phoneNumber, 'transaction')

    return {
      success: true,
      message: `✅ Transação registrada com sucesso!\n💰 R$ ${transaction.amount.toFixed(2).replace('.', ',')}`,
    }
  } catch (error) {
    console.error('[CONFIRMATION_FLOW] Erro ao confirmar transação:', error)
    return {
      success: false,
      message: 'Erro ao salvar transação. Tente novamente.',
    }
  }
}

/**
 * Confirma e salva compromisso no banco
 */
export async function confirmAppointment(phoneNumber: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const context = await getSessionContext(phoneNumber)

    if (!context || !context.pendingAppointment) {
      return {
        success: false,
        message: 'Não há compromisso pendente para confirmar.',
      }
    }

    const { pendingAppointment, userId, tenantId } = context

    // Validar data futura
    if (!pendingAppointment.date) {
      return {
        success: false,
        message: 'Data do compromisso é obrigatória.',
      }
    }

    if (pendingAppointment.date < new Date()) {
      return {
        success: false,
        message: 'Não é possível agendar compromissos no passado.',
      }
    }

    // Criar compromisso no banco
    const appointment = await prisma.commitment.create({
      data: {
        familyId: tenantId,
        userId,
        title: pendingAppointment.title || 'Compromisso',
        description: pendingAppointment.description || '',
        date: pendingAppointment.date,
      },
    })

    // Limpar contexto pendente
    await clearPendingContext(phoneNumber, 'appointment')

    return {
      success: true,
      message: `✅ Compromisso agendado com sucesso!\n📅 ${appointment.title} - ${formatDateForDisplay(appointment.date)}`,
    }
  } catch (error) {
    console.error('[CONFIRMATION_FLOW] Erro ao confirmar compromisso:', error)
    return {
      success: false,
      message: 'Erro ao salvar compromisso. Tente novamente.',
    }
  }
}

/**
 * Cancela transação ou compromisso pendente
 */
export async function cancelPending(
  phoneNumber: string,
  type: 'transaction' | 'appointment'
): Promise<string> {
  await clearPendingContext(phoneNumber, type)
  return '❌ Operação cancelada. Como posso ajudar?'
}

/**
 * Obtém ID da categoria pelo nome
 */
async function getCategoryId(tenantId: string, categoryName: string): Promise<string | null> {
  try {
    const category = await prisma.category.findFirst({
      where: {
        familyId: tenantId,
        name: {
          contains: categoryName,
          mode: 'insensitive',
        },
      },
    })

    return category?.id || null
  } catch (error) {
    console.error('[CONFIRMATION_FLOW] Erro ao buscar categoria:', error)
    return null
  }
}

