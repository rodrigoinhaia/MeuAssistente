import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// Conectar N8N
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const { n8nUrl, n8nApiKey, webhookUrl } = await req.json()
    
    if (!n8nUrl || !n8nApiKey) {
      return NextResponse.json(
        { status: 'error', message: 'URL do N8N e API Key são obrigatórios.' },
        { status: 400 }
      )
    }

    // Validar URL do N8N
    try {
      new URL(n8nUrl)
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'URL do N8N inválida.' },
        { status: 400 }
      )
    }

    // Testar conexão com N8N
    try {
      const testResponse = await fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!testResponse.ok) {
        return NextResponse.json(
          { status: 'error', message: 'Erro ao conectar com N8N. Verifique a URL e a API Key.' },
          { status: 400 }
        )
      }
    } catch (err: any) {
      return NextResponse.json(
        { status: 'error', message: 'Erro ao validar conexão com N8N: ' + err.message },
        { status: 500 }
      )
    }

    // Armazenar configuração no campo scope como JSON
    const scope = JSON.stringify({
      n8nUrl,
      n8nApiKey,
      webhookUrl: webhookUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/n8n`,
    })

    // Upsert: cria se não existe, atualiza se existe
    const integration = await prisma.integration.upsert({
      where: {
        familyId_userId_provider: {
          familyId,
          userId,
          provider: 'n8n',
        },
      },
      update: {
        accessToken: n8nApiKey, // Armazenar API Key como accessToken
        scope,
        isActive: true,
      },
      create: {
        provider: 'n8n',
        accessToken: n8nApiKey,
        scope,
        familyId,
        userId,
        isActive: true,
      },
    })

    return NextResponse.json({ status: 'ok', integration })
  } catch (error) {
    console.error('[N8N_CONNECT]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao conectar N8N', error: String(error) },
      { status: 500 }
    )
  }
}

// Verificar status do N8N
export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        familyId_userId_provider: {
          familyId,
          userId,
          provider: 'n8n',
        },
      },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { status: 'error', message: 'N8N não está conectado.' },
        { status: 404 }
      )
    }

    const config = JSON.parse(integration.scope || '{}')
    const { n8nUrl, n8nApiKey } = config

    // Buscar workflows do N8N
    try {
      const workflowsResponse = await fetch(`${n8nUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!workflowsResponse.ok) {
        return NextResponse.json(
          { status: 'error', message: 'Erro ao verificar status do N8N.' },
          { status: 500 }
        )
      }

      const workflows = await workflowsResponse.json()
      const activeWorkflows = workflows.data?.filter((w: any) => w.active) || []

      return NextResponse.json({
        status: 'ok',
        n8n: {
          connected: true,
          url: n8nUrl,
          totalWorkflows: workflows.data?.length || 0,
          activeWorkflows: activeWorkflows.length,
          workflows: activeWorkflows.map((w: any) => ({
            id: w.id,
            name: w.name,
            active: w.active,
          })),
        },
      })
    } catch (err: any) {
      return NextResponse.json(
        { status: 'error', message: 'Erro ao verificar status: ' + err.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[N8N_STATUS]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao verificar status', error: String(error) },
      { status: 500 }
    )
  }
}

// Desconectar N8N
export async function DELETE(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    await prisma.integration.deleteMany({
      where: {
        familyId,
        userId,
        provider: 'n8n',
      },
    })

    return NextResponse.json({ status: 'ok', message: 'N8N desconectado com sucesso.' })
  } catch (error) {
    console.error('[N8N_DISCONNECT]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao desconectar N8N', error: String(error) },
      { status: 500 }
    )
  }
}

