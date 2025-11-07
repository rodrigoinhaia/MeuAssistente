import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, getPaymentConfirmedEmailTemplate } from '@/lib/email'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Webhook do Asaas para receber notificações de pagamentos
 * Documentação: https://docs.asaas.com/reference/webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Tipos de eventos do Asaas
    const event = body.event
    const payment = body.payment || body.subscription

    console.log('[ASAAS_WEBHOOK]', { event, paymentId: payment?.id, status: payment?.status })

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      // Pagamento confirmado
      const paymentId = payment.id
      const subscriptionId = payment.externalReference || payment.subscription

      // Buscar assinatura pelo ID do Asaas ou pelo externalReference
      const subscription = await prisma.subscription.findFirst({
        where: {
          OR: [
            { asaasSubscriptionId: subscriptionId },
            { id: subscriptionId },
          ],
        },
        include: { 
          family: true,
          plan: true,
        },
      })

      if (subscription) {
        // Atualizar status da assinatura para ativa
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'active',
            endDate: null, // Remove data de expiração (trial acabou, agora é assinatura ativa)
          },
        })

        // Criar registro de pagamento
        await prisma.payment.create({
          data: {
            familyId: subscription.familyId,
            subscriptionId: subscription.id,
            amount: Number(payment.value || payment.amount),
            status: 'paid',
            dueDate: new Date(payment.dueDate || payment.dueDate),
            paidDate: new Date(),
            invoiceNumber: payment.invoiceNumber || payment.id,
            paymentMethod: payment.billingType?.toLowerCase() || 'credit_card',
            transactionId: paymentId,
          },
        })

        // Ativar família
        await prisma.family.update({
          where: { id: subscription.familyId },
          data: { isActive: true },
        })

        // Buscar owner para enviar email
        const owner = await prisma.user.findFirst({
          where: {
            familyId: subscription.familyId,
            role: 'OWNER',
            isActive: true,
          },
        })

        // Enviar email de confirmação de pagamento
        if (owner) {
          try {
            const nextBillingDate = payment.nextDueDate
              ? format(new Date(payment.nextDueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : undefined

            const html = getPaymentConfirmedEmailTemplate({
              userName: owner.name,
              planName: subscription.plan?.name || 'Plano',
              amount: Number(payment.value || payment.amount),
              nextBillingDate,
            })

            await sendEmail({
              to: owner.email,
              subject: '✅ Pagamento confirmado - Assinatura ativada!',
              html,
            })

            console.log('[ASAAS_WEBHOOK] Email de confirmação enviado para:', owner.email)
          } catch (emailError) {
            console.error('[ASAAS_WEBHOOK] Erro ao enviar email:', emailError)
            // Não falha o webhook se o email falhar
          }
        }

        console.log('[ASAAS_WEBHOOK] Assinatura ativada:', subscription.id)
      }
    } else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_REFUSED') {
      // Pagamento vencido ou recusado
      const subscriptionId = payment.externalReference || payment.subscription

      const subscription = await prisma.subscription.findFirst({
        where: {
          OR: [
            { asaasSubscriptionId: subscriptionId },
            { id: subscriptionId },
          ],
        },
      })

      if (subscription) {
        // Se estiver em trial, não faz nada (trial continua)
        // Se estiver ativa, pode desativar ou manter (depende da política)
        if (subscription.status === 'active') {
          // Opção: desativar após X dias sem pagamento
          // Por enquanto, apenas marca como pendente
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'inactive' },
          })

          await prisma.family.update({
            where: { id: subscription.familyId },
            data: { isActive: false },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[ASAAS_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook do Asaas está ativo' })
}

