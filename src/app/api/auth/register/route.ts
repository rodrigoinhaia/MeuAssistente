import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createAsaasCustomer, createAsaasSubscription } from '@/lib/asaas'

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      cpf,
      phoneNumber,
      address,
      familyName,
      planId, // Novo: ID do plano escolhido
    } = await req.json()

    if (!name || !email || !password || !cpf || !phoneNumber || !address || !familyName || !planId) {
      return NextResponse.json({ status: 'error', message: 'Todos os campos obrigatórios devem ser preenchidos, incluindo o plano.' }, { status: 400 })
    }

    // Função utilitária para validar CPF
    function isValidCPF(cpf: string): boolean {
      cpf = cpf.replace(/\D/g, '')
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
      let sum = 0, rest
      for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
      rest = (sum * 10) % 11
      if (rest === 10 || rest === 11) rest = 0
      if (rest !== parseInt(cpf.substring(9, 10))) return false
      sum = 0
      for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
      rest = (sum * 10) % 11
      if (rest === 10 || rest === 11) rest = 0
      if (rest !== parseInt(cpf.substring(10, 11))) return false
      return true
    }

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ status: 'error', message: 'CPF inválido.' }, { status: 400 })
    }

    // Verifica se já existe usuário
    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: 'E-mail já cadastrado.' }, { status: 400 })
    }

    // Verifica se o plano existe
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ status: 'error', message: 'Plano inválido ou inativo.' }, { status: 400 })
    }

    // Cria família se necessário (busca por telefone)
    let family = await prisma.family.findUnique({ where: { phoneNumber } })
    if (!family) {
      family = await prisma.family.create({
        data: {
          name: familyName,
          phone: phoneNumber,
          phoneNumber,
          subscriptionPlan: plan.name.toLowerCase(),
        },
      })
    }

    // Cria usuário OWNER
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone: phoneNumber,
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        role: 'OWNER',
        familyId: family.id,
      },
    })

    // Calcula datas do trial (3 dias grátis)
    const startDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 3) // 3 dias de trial
    const firstBillingDate = new Date(trialEndDate)
    firstBillingDate.setDate(firstBillingDate.getDate() + 1) // Primeira cobrança no dia seguinte ao fim do trial

    // Cria cliente no Asaas
    let asaasCustomerId: string | null = null
    try {
      const asaasCustomer = await createAsaasCustomer({
        name: familyName,
        email,
        cpfCnpj: cpf.replace(/\D/g, ''),
        phone: phoneNumber.replace(/\D/g, ''),
        postalCode: address.cep?.replace(/\D/g, ''),
        address: address.street,
        addressNumber: address.number,
        complement: address.complement,
        province: address.neighborhood,
        city: address.city,
        state: address.state,
      })
      asaasCustomerId = asaasCustomer.id

      // Salvar integração Asaas (armazena customerId no accessToken)
      await prisma.integration.create({
        data: {
          familyId: family.id,
          userId: user.id,
          provider: 'asaas',
          accessToken: asaasCustomerId, // Armazena o customerId do Asaas
          isActive: true,
        },
      })
    } catch (error) {
      console.error('[ASAAS_CUSTOMER]', error)
      // Continua mesmo se falhar - pode criar depois
    }

    // Cria assinatura no banco (status: trial)
    const subscription = await prisma.subscription.create({
      data: {
        familyId: family.id,
        planId: plan.id,
        status: 'trial', // Novo status para trial
        startDate,
        endDate: trialEndDate, // Fim do trial
        price: Number(plan.price),
        asaasSubscriptionId: null, // Será criado após trial
      },
    })

    // Cria assinatura no Asaas (começando após o trial)
    let asaasSubscriptionId: string | null = null
    if (asaasCustomerId) {
      try {
        const asaasSubscription = await createAsaasSubscription({
          customer: asaasCustomerId,
          billingType: 'CREDIT_CARD', // Pode ser alterado depois
          value: Number(plan.price),
          nextDueDate: firstBillingDate.toISOString().split('T')[0],
          cycle: 'MONTHLY',
          description: `Assinatura ${plan.name} - MeuAssistente`,
          externalReference: subscription.id,
        })
        asaasSubscriptionId = asaasSubscription.id

        // Atualiza assinatura com ID do Asaas
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { asaasSubscriptionId },
        })
      } catch (error) {
        console.error('[ASAAS_SUBSCRIPTION]', error)
        // Continua mesmo se falhar - pode criar depois
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Usuário registrado com sucesso! Você tem 3 dias grátis para testar.',
      user: { id: user.id, name: user.name, email: user.email },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEndDate: trialEndDate.toISOString(),
        planName: plan.name,
      },
    })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao registrar usuário', error: String(error) }, { status: 500 })
  }
} 