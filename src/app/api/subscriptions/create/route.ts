import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { createAsaasPayment, createAsaasCustomer, getAsaasSubscription } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role
    const familyId = (session.user as any)?.familyId

    if (userRole !== 'OWNER') {
      return NextResponse.json({ error: 'Apenas OWNER pode criar assinaturas' }, { status: 403 })
    }

    if (!familyId) {
      return NextResponse.json({ error: 'Família não encontrada' }, { status: 404 })
    }

    const { planId, paymentMethod = 'CREDIT_CARD' } = await req.json()

    if (!planId) {
      return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 })
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano não encontrado ou inativo' }, { status: 404 })
    }

    // Buscar família e usuário
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { users: { where: { role: 'OWNER' }, take: 1 } },
    })

    if (!family || !family.users[0]) {
      return NextResponse.json({ error: 'Família ou usuário não encontrado' }, { status: 404 })
    }

    const owner = family.users[0]

    // Verificar se já existe assinatura ativa ou em trial
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        familyId,
        status: { in: ['trial', 'active'] },
      },
    })

    // Se já tem assinatura em trial, atualizar para o novo plano
    if (existingSubscription) {
      // Cancelar assinatura antiga no Asaas (se tiver)
      if (existingSubscription.asaasSubscriptionId) {
        try {
          // Aqui você cancelaria no Asaas se necessário
        } catch (err) {
          console.error('[CANCEL_OLD_SUBSCRIPTION]', err)
        }
      }

      // Atualizar assinatura
      const updatedSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: plan.id,
          price: Number(plan.price),
          status: 'active', // Ativa imediatamente (trial acabou ou está sendo atualizado)
          endDate: null,
        },
      })

      // Buscar ou criar cliente no Asaas
      let asaasCustomerId: string | null = null
      try {
        // Tentar buscar integração Asaas existente
        const asaasIntegration = await prisma.integration.findFirst({
          where: {
            familyId,
            provider: 'asaas',
          },
        })

        if (asaasIntegration) {
          // Usar ID do cliente armazenado no accessToken (que armazena o customerId)
          asaasCustomerId = asaasIntegration.accessToken
        } else {
          // Criar novo cliente no Asaas
          const asaasCustomer = await createAsaasCustomer({
            name: family.name,
            email: owner.email,
            cpfCnpj: owner.cpf.replace(/\D/g, ''),
            phone: owner.phone.replace(/\D/g, ''),
            postalCode: owner.cep?.replace(/\D/g, ''),
            address: owner.street ?? undefined,
            addressNumber: owner.number ?? undefined,
            complement: owner.complement ?? undefined,
            province: owner.neighborhood ?? undefined,
            city: owner.city ?? undefined,
            state: owner.state ?? undefined,
          })
          asaasCustomerId = asaasCustomer.id

          // Salvar integração Asaas
          await prisma.integration.create({
            data: {
              familyId,
              userId: owner.id,
              provider: 'asaas',
              accessToken: asaasCustomerId, // Armazena o customerId aqui
              isActive: true,
            },
          })
        }
      } catch (err: any) {
        console.error('[ASAAS_CUSTOMER_CREATE]', err)
        return NextResponse.json({
          status: 'error',
          message: 'Erro ao criar/buscar cliente no Asaas: ' + err.message,
        }, { status: 500 })
      }

      // Criar primeira cobrança
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1) // Vencimento amanhã

      try {
        const asaasPayment = await createAsaasPayment({
          customer: asaasCustomerId!,
          billingType: paymentMethod,
          value: Number(plan.price),
          dueDate: dueDate.toISOString().split('T')[0],
          description: `Assinatura ${plan.name} - MeuAssistente`,
          externalReference: updatedSubscription.id,
        })

        // Criar registro de pagamento
        await prisma.payment.create({
          data: {
            familyId,
            subscriptionId: updatedSubscription.id,
            amount: Number(plan.price),
            status: paymentMethod === 'PIX' ? 'paid' : 'pending',
            dueDate,
            invoiceNumber: asaasPayment.id,
            paymentMethod: paymentMethod.toLowerCase(),
            transactionId: asaasPayment.id,
          },
        })

        return NextResponse.json({
          status: 'ok',
          message: 'Assinatura atualizada com sucesso!',
          subscription: updatedSubscription,
          paymentUrl: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || asaasPayment.pixQrCode,
          invoiceUrl: asaasPayment.invoiceUrl,
        })
      } catch (err: any) {
        console.error('[ASAAS_PAYMENT]', err)
        return NextResponse.json({
          status: 'error',
          message: 'Erro ao criar cobrança no Asaas: ' + err.message,
        }, { status: 500 })
      }
    }

    // Criar nova assinatura
    const subscription = await prisma.subscription.create({
      data: {
        familyId,
        planId: plan.id,
        status: 'active',
        startDate: new Date(),
        price: Number(plan.price),
      },
    })

    // Buscar ou criar cliente no Asaas
    let asaasCustomerId: string | null = null
    try {
      // Tentar buscar integração Asaas existente
      const asaasIntegration = await prisma.integration.findFirst({
        where: {
          familyId,
          provider: 'asaas',
        },
      })

      if (asaasIntegration) {
        // Usar ID do cliente armazenado no accessToken
        asaasCustomerId = asaasIntegration.accessToken
      } else {
        // Criar novo cliente no Asaas
        const asaasCustomer = await createAsaasCustomer({
          name: family.name,
          email: owner.email,
          cpfCnpj: owner.cpf.replace(/\D/g, ''),
          phone: owner.phone.replace(/\D/g, ''),
          postalCode: owner.cep?.replace(/\D/g, ''),
          address: owner.street ?? undefined,
          addressNumber: owner.number ?? undefined,
          complement: owner.complement ?? undefined,
          province: owner.neighborhood ?? undefined,
          city: owner.city ?? undefined,
          state: owner.state ?? undefined,
        })
        asaasCustomerId = asaasCustomer.id

        // Salvar integração Asaas
        await prisma.integration.create({
          data: {
            familyId,
            userId: owner.id,
            provider: 'asaas',
            accessToken: asaasCustomerId, // Armazena o customerId
            isActive: true,
          },
        })
      }
    } catch (err: any) {
      console.error('[ASAAS_CUSTOMER_CREATE]', err)
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao criar/buscar cliente no Asaas: ' + err.message,
      }, { status: 500 })
    }

    // Criar primeira cobrança
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)

    try {
      const asaasPayment = await createAsaasPayment({
        customer: asaasCustomerId!,
        billingType: paymentMethod,
        value: Number(plan.price),
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura ${plan.name} - MeuAssistente`,
        externalReference: subscription.id,
      })

      // Criar registro de pagamento
      await prisma.payment.create({
        data: {
          familyId,
          subscriptionId: subscription.id,
          amount: Number(plan.price),
          status: paymentMethod === 'PIX' ? 'paid' : 'pending',
          dueDate,
          invoiceNumber: asaasPayment.id,
          paymentMethod: paymentMethod.toLowerCase(),
          transactionId: asaasPayment.id,
        },
      })

      // Ativar família
      await prisma.family.update({
        where: { id: familyId },
        data: { isActive: true, subscriptionPlan: plan.name.toLowerCase() },
      })

      return NextResponse.json({
        status: 'ok',
        message: 'Assinatura criada com sucesso!',
        subscription,
        paymentUrl: asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || asaasPayment.pixQrCode,
        invoiceUrl: asaasPayment.invoiceUrl,
      })
    } catch (err: any) {
      console.error('[ASAAS_PAYMENT]', err)
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao criar cobrança no Asaas: ' + err.message,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[CREATE_SUBSCRIPTION]', error)
    return NextResponse.json({ error: 'Erro ao criar assinatura', message: error.message }, { status: 500 })
  }
}

