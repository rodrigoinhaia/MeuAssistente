import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// Listar instituições disponíveis (exemplo com Plugg.to ou similar)
export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    if (action === 'institutions') {
      // Retornar lista de instituições disponíveis via Open Finance
      // Em produção, isso viria de um provedor como Plugg.to, Belvo, etc.
      const institutions = [
        { id: '001', name: 'Banco do Brasil', code: '001' },
        { id: '033', name: 'Santander', code: '033' },
        { id: '104', name: 'Caixa Econômica Federal', code: '104' },
        { id: '237', name: 'Bradesco', code: '237' },
        { id: '341', name: 'Itaú', code: '341' },
        { id: '422', name: 'Safra', code: '422' },
        { id: '748', name: 'Sicredi', code: '748' },
        { id: '756', name: 'Bancoob', code: '756' },
      ]
      
      return NextResponse.json({ status: 'ok', institutions })
    }

    // Buscar conexões bancárias do usuário
    const connections = await prisma.bankConnection.findMany({
      where: { familyId, userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ status: 'ok', connections })
  } catch (error) {
    console.error('[OPEN_FINANCE_GET]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar conexões', error: String(error) },
      { status: 500 }
    )
  }
}

// Iniciar fluxo de conexão Open Finance
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const { institutionId, institutionName, provider = 'openbanking' } = await req.json()
    
    if (!institutionId || !institutionName) {
      return NextResponse.json(
        { status: 'error', message: 'Instituição é obrigatória.' },
        { status: 400 }
      )
    }

    // Em produção, aqui você iniciaria o fluxo OAuth do Open Finance
    // Retornando uma URL de autorização para o usuário
    // Por enquanto, simulando o fluxo
    
    const authUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/integrations/open-finance/authorize?institution=${institutionId}&familyId=${familyId}&userId=${userId}`
    
    // Criar conexão pendente
    const connection = await prisma.bankConnection.create({
      data: {
        familyId,
        userId,
        provider,
        institutionName,
        institutionId,
        status: 'pending',
        accessToken: 'pending', // Será atualizado após autorização
      },
    })

    return NextResponse.json({
      status: 'ok',
      connection,
      authUrl, // URL para o usuário autorizar no banco
      message: 'Acesse a URL de autorização para conectar sua conta bancária',
    })
  } catch (error) {
    console.error('[OPEN_FINANCE_POST]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao criar conexão', error: String(error) },
      { status: 500 }
    )
  }
}

// Atualizar conexão (após callback de autorização)
export async function PATCH(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const { connectionId, accessToken, refreshToken, expiresAt, consentId, accountId, accountType, accountNumber } = await req.json()
    
    if (!connectionId) {
      return NextResponse.json(
        { status: 'error', message: 'ID da conexão é obrigatório.' },
        { status: 400 }
      )
    }

    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        familyId,
        userId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { status: 'error', message: 'Conexão não encontrada.' },
        { status: 404 }
      )
    }

    const updated = await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        consentId,
        accountId,
        accountType,
        accountNumber,
        status: 'active',
      },
    })

    return NextResponse.json({ status: 'ok', connection: updated })
  } catch (error) {
    console.error('[OPEN_FINANCE_PATCH]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao atualizar conexão', error: String(error) },
      { status: 500 }
    )
  }
}

// Desconectar conta bancária
export async function DELETE(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const { connectionId } = await req.json()
    
    if (!connectionId) {
      return NextResponse.json(
        { status: 'error', message: 'ID da conexão é obrigatório.' },
        { status: 400 }
      )
    }

    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        familyId,
        userId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { status: 'error', message: 'Conexão não encontrada.' },
        { status: 404 }
      )
    }

    // Em produção, aqui você revogaria o consentimento no provedor Open Finance
    // Por enquanto, apenas atualizando o status
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { status: 'revoked' },
    })

    return NextResponse.json({ status: 'ok', message: 'Conexão bancária desconectada com sucesso.' })
  } catch (error) {
    console.error('[OPEN_FINANCE_DELETE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao desconectar', error: String(error) },
      { status: 500 }
    )
  }
}

