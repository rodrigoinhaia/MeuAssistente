import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// Criar instância do Evolution API
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
  }

  const validFamilyId: string = familyId
  
  try {
    const { apiUrl, apiKey, instanceName } = await req.json()
    
    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json(
        { status: 'error', message: 'URL da API, API Key e Nome da Instância são obrigatórios.' },
        { status: 400 }
      )
    }

    // Validar URL da API
    try {
      new URL(apiUrl)
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'URL da API inválida.' },
        { status: 400 }
      )
    }

    // Verificar se a instância já existe no Evolution API
    try {
      const instancesResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!instancesResponse.ok) {
        return NextResponse.json(
          { status: 'error', message: 'Erro ao conectar com Evolution API. Verifique a URL e a API Key.' },
          { status: 400 }
        )
      }

      const instances = await instancesResponse.json()
      const instanceExists = instances.find((inst: any) => inst.instance.instanceName === instanceName)

      if (instanceExists) {
        // Instância já existe, buscar QR Code se não estiver conectada
        const connectionState = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (connectionState.ok) {
          const state = await connectionState.json()
          return NextResponse.json({
            status: 'ok',
            instance: {
              name: instanceName,
              exists: true,
              connected: state.state === 'open',
              qrcode: state.qrcode || null,
              state: state.state,
            },
            message: state.state === 'open' 
              ? 'Instância já está conectada' 
              : 'Instância existe mas não está conectada. Use o QR Code para conectar.',
          })
        }
      } else {
        // Criar nova instância
        const createResponse = await fetch(`${apiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName,
            token: `${instanceName}_token_${Date.now()}`, // Token único
            qrcode: true,
          }),
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}))
          return NextResponse.json(
            { status: 'error', message: errorData.message || 'Erro ao criar instância no Evolution API' },
            { status: 400 }
          )
        }

        const createData = await createResponse.json()
        
        // Armazenar configuração no Integration para passar ao N8N depois
        const scope = JSON.stringify({
          apiUrl,
          apiKey,
          instanceName,
          token: createData.token || `${instanceName}_token_${Date.now()}`,
        })

        const integration = await prisma.integration.upsert({
          where: {
            familyId_userId_provider: {
              familyId: validFamilyId,
              userId,
              provider: 'evolution_api',
            },
          },
          update: {
            accessToken: apiKey,
            scope,
            isActive: true,
          },
          create: {
            provider: 'evolution_api',
            accessToken: apiKey,
            scope,
            familyId: validFamilyId,
            userId,
            isActive: true,
          },
        })

        return NextResponse.json({
          status: 'ok',
          integration,
          instance: {
            name: instanceName,
            exists: false,
            created: true,
            qrcode: createData.qrcode?.base64 || createData.qrcode || null,
            state: 'close',
            connected: false,
          },
          message: 'Instância criada com sucesso! Escaneie o QR Code para conectar seu WhatsApp.',
        })
      }
    } catch (err: any) {
      return NextResponse.json(
        { status: 'error', message: 'Erro ao gerenciar instância: ' + err.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[EVOLUTION_API_CREATE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao criar instância', error: String(error) },
      { status: 500 }
    )
  }
}

// Verificar status da instância e obter QR Code
export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
  }

  const validFamilyId: string = familyId
  
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        familyId_userId_provider: {
          familyId: validFamilyId,
          userId,
          provider: 'evolution_api',
        },
      },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { status: 'error', message: 'Evolution API não está configurada.' },
        { status: 404 }
      )
    }

    const config = JSON.parse(integration.scope || '{}')
    const { apiUrl, apiKey, instanceName } = config

    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json(
        { status: 'error', message: 'Configuração incompleta da Evolution API.' },
        { status: 400 }
      )
    }

    // Buscar status da instância
    try {
      const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!statusResponse.ok) {
        return NextResponse.json(
          { status: 'error', message: 'Erro ao verificar status da instância.' },
          { status: 500 }
        )
      }

      const status = await statusResponse.json()

      // Se não estiver conectada, buscar QR Code
      let qrcode = null
      if (status.state !== 'open') {
        try {
          const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json',
            },
          })

          if (qrResponse.ok) {
            const qrData = await qrResponse.json()
            qrcode = qrData.qrcode?.base64 || qrData.base64 || qrData.qrcode || null
          }
        } catch (err) {
          // QR Code pode não estar disponível ainda
        }
      }

      return NextResponse.json({
        status: 'ok',
        instance: {
          name: instanceName,
          state: status.state || 'unknown',
          connected: status.state === 'open',
          qrcode,
          // Informações para passar ao N8N
          n8nConfig: {
            apiUrl,
            apiKey,
            instanceName,
            token: config.token,
          },
        },
      })
    } catch (err: any) {
      return NextResponse.json(
        { status: 'error', message: 'Erro ao verificar status: ' + err.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[EVOLUTION_API_STATUS]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao verificar status', error: String(error) },
      { status: 500 }
    )
  }
}

// Atualizar configuração (para passar ao N8N)
export async function PATCH(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
  }

  const validFamilyId: string = familyId
  
  try {
    const { n8nWorkflowId } = await req.json()
    
    const integration = await prisma.integration.findUnique({
      where: {
        familyId_userId_provider: {
          familyId: validFamilyId,
          userId,
          provider: 'evolution_api',
        },
      },
    })

    if (!integration) {
      return NextResponse.json(
        { status: 'error', message: 'Evolution API não está configurada.' },
        { status: 404 }
      )
    }

    const config = JSON.parse(integration.scope || '{}')
    
    // Atualizar com ID do workflow N8N (se fornecido)
    if (n8nWorkflowId) {
      config.n8nWorkflowId = n8nWorkflowId
    }

    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: {
        scope: JSON.stringify(config),
      },
    })

    return NextResponse.json({
      status: 'ok',
      integration: updated,
      message: 'Configuração atualizada. As credenciais estão prontas para uso no N8N.',
    })
  } catch (error) {
    console.error('[EVOLUTION_API_UPDATE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao atualizar configuração', error: String(error) },
      { status: 500 }
    )
  }
}

// Desconectar/Remover instância
export async function DELETE(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
  }

  const validFamilyId: string = familyId
  
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        familyId_userId_provider: {
          familyId: validFamilyId,
          userId,
          provider: 'evolution_api',
        },
      },
    })

    if (integration) {
      const config = JSON.parse(integration.scope || '{}')
      const { apiUrl, apiKey, instanceName } = config

      // Deletar instância no Evolution API (opcional)
      if (apiUrl && apiKey && instanceName) {
        try {
          await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json',
            },
          })
        } catch (err) {
          // Ignorar erro - pode já ter sido deletada
        }
      }
    }

    await prisma.integration.deleteMany({
      where: {
        familyId: validFamilyId,
        userId,
        provider: 'evolution_api',
      },
    })

    return NextResponse.json({ status: 'ok', message: 'Instância Evolution API removida com sucesso.' })
  } catch (error) {
    console.error('[EVOLUTION_API_DELETE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao remover instância', error: String(error) },
      { status: 500 }
    )
  }
}

