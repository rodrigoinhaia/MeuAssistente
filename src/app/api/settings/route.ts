import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

interface SystemSettings {
  companyName: string
  supportEmail: string
  maxUsersPerfamily: number
  trialDays: number
  enableWhatsAppIntegration: boolean
  enableGoogleIntegration: boolean
  enableEmailNotifications: boolean
  enableSMSNotifications: boolean
  maintenanceMode: boolean
  debugMode: boolean
}

// Configurações padrão do sistema
const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'MeuAssistente',
  supportEmail: 'suporte@meuassistente.com',
  maxUsersPerfamily: 50,
  trialDays: 3, // 3 dias conforme implementado
  enableWhatsAppIntegration: true,
  enableGoogleIntegration: true,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  maintenanceMode: false,
  debugMode: false,
}

// Chave única para as configurações do sistema (usando uma chave fixa)
const SYSTEM_SETTINGS_KEY = 'system_settings'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'

  const { session, role, error, adminContext: context } = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  // Apenas SUPER_ADMIN pode ver configurações do sistema
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Apenas Super Admins podem ver configurações do sistema.' },
      { status: 403 }
    )
  }

  try {
    // Buscar configurações do banco de dados
    const config = await prisma.systemConfig.findUnique({
      where: { key: SYSTEM_SETTINGS_KEY }
    })

    if (config) {
      return NextResponse.json({
        status: 'ok',
        settings: config.value as SystemSettings,
      })
    }

    // Se não existir, retornar padrões
    return NextResponse.json({
      status: 'ok',
      settings: DEFAULT_SETTINGS,
    })
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    // Em caso de erro, retornar padrões
    return NextResponse.json({
      status: 'ok',
      settings: DEFAULT_SETTINGS,
    })
  }
}

export async function PUT(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'

  const { session, role, error, adminContext: context } = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  // Apenas SUPER_ADMIN pode alterar configurações do sistema
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Apenas Super Admins podem alterar configurações do sistema.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const {
      companyName,
      supportEmail,
      maxUsersPerfamily,
      trialDays,
      enableWhatsAppIntegration,
      enableGoogleIntegration,
      enableEmailNotifications,
      enableSMSNotifications,
      maintenanceMode,
      debugMode,
    } = body

    // Validações
    if (!companyName || !supportEmail) {
      return NextResponse.json(
        { status: 'error', message: 'Nome da empresa e email de suporte são obrigatórios' },
        { status: 400 }
      )
    }

    if (maxUsersPerfamily < 1 || maxUsersPerfamily > 1000) {
      return NextResponse.json(
        { status: 'error', message: 'Máximo de usuários deve estar entre 1 e 1000' },
        { status: 400 }
      )
    }

    if (trialDays < 0 || trialDays > 365) {
      return NextResponse.json(
        { status: 'error', message: 'Dias de trial devem estar entre 0 e 365' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(supportEmail)) {
      return NextResponse.json(
        { status: 'error', message: 'Email de suporte inválido' },
        { status: 400 }
      )
    }

    // Por enquanto, vamos apenas validar e retornar sucesso
    // TODO: Criar tabela SystemConfig no Prisma e persistir as configurações
    // Por enquanto, as configurações são apenas validadas mas não persistidas
    // Em produção, implementar persistência no banco de dados

    const updatedSettings: SystemSettings = {
      companyName: companyName.trim(),
      supportEmail: supportEmail.trim().toLowerCase(),
      maxUsersPerfamily: Number(maxUsersPerfamily),
      trialDays: Number(trialDays),
      enableWhatsAppIntegration: Boolean(enableWhatsAppIntegration),
      enableGoogleIntegration: Boolean(enableGoogleIntegration),
      enableEmailNotifications: Boolean(enableEmailNotifications),
      enableSMSNotifications: Boolean(enableSMSNotifications),
      maintenanceMode: Boolean(maintenanceMode),
      debugMode: Boolean(debugMode),
    }

    // Salvar no banco de dados
    await prisma.systemConfig.upsert({
      where: { key: SYSTEM_SETTINGS_KEY },
      update: {
        value: updatedSettings as any,
        updatedAt: new Date()
      },
      create: {
        key: SYSTEM_SETTINGS_KEY,
        value: updatedSettings as any
      },
    })

    return NextResponse.json({
      status: 'ok',
      message: 'Configurações salvas com sucesso',
      settings: updatedSettings,
    })
  } catch (error) {
    console.error('[SETTINGS_PUT]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao salvar configurações', error: String(error) },
      { status: 500 }
    )
  }
}

