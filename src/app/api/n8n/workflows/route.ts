import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    // SUPER_ADMIN em modo admin vê todos os workflows
    // SUPER_ADMIN em modo família e OWNER vê apenas workflows da sua família
    const whereClause = (role === 'SUPER_ADMIN' && context === 'admin') ? {} : { familyId }

    const workflows = await prisma.n8NWorkflow.findMany({
      where: whereClause,
      orderBy: { lastExecution: 'desc' },
    })

    // Buscar logs de processamento relacionados
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const processingLogs = await prisma.processingLog.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: today },
        type: { in: ['google_calendar', 'google_tasks', 'whatsapp'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatar workflows com estatísticas
    const workflowsWithStats = workflows.map((workflow) => {
      // Buscar logs relacionados ao workflow (por tipo ou dados do log)
      const workflowLogs = processingLogs.filter((log) => {
        // Tentar encontrar logs relacionados ao workflow pelo tipo ou dados
        if (log.data && typeof log.data === 'object') {
          const logData = log.data as any
          // Verificar se há referência ao workflow no log
          if (logData.workflowId === workflow.workflowId || logData.workflowName === workflow.name) {
            return true
          }
        }
        // Fallback: relacionar por tipo de log (google_calendar, google_tasks podem estar relacionados)
        return false
      })

      const executionsToday = workflowLogs.length
      const successfulExecutions = workflowLogs.filter((log) => log.status === 'success').length
      const successRate = executionsToday > 0 ? (successfulExecutions / executionsToday) * 100 : 0

      return {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status as 'active' | 'inactive' | 'error',
        lastExecution: workflow.lastExecution?.toISOString() || new Date().toISOString(),
        executionsToday,
        successRate: Number(successRate.toFixed(1)),
      }
    })

    // Formatar logs de execução (usar todos os logs de processamento como logs de execução)
    const executionLogs = processingLogs.slice(0, 50).map((log) => {
      // Tentar encontrar workflow relacionado
      let workflowName = 'Workflow Desconhecido'
      if (log.data && typeof log.data === 'object') {
        const logData = log.data as any
        const relatedWorkflow = workflows.find(
          (w) => logData.workflowId === w.workflowId || logData.workflowName === w.name
        )
        if (relatedWorkflow) {
          workflowName = relatedWorkflow.name
        } else if (logData.workflowName) {
          workflowName = logData.workflowName
        } else {
          // Usar o tipo de log como nome do workflow
          workflowName = log.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        }
      } else {
        // Usar o tipo de log como nome do workflow
        workflowName = log.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      }

      const startTime = log.createdAt
      const endTime = log.createdAt // Por enquanto, usando createdAt como endTime
      const duration = 0 // Pode ser calculado se tivermos dados de duração no log

      return {
        id: log.id,
        workflowName,
        status: log.status === 'success' ? 'success' : 'error',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        errorMessage: log.status === 'error' ? log.message : undefined,
      }
    })

    return NextResponse.json({
      status: 'ok',
      workflows: workflowsWithStats,
      executionLogs,
    })
  } catch (error) {
    console.error('[N8N_WORKFLOWS_GET]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar workflows do N8N', error: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    const { workflowId, status } = await req.json()

    if (!workflowId || !status) {
      return NextResponse.json({ status: 'error', message: 'workflowId e status são obrigatórios' }, { status: 400 })
    }

    // Buscar o workflow primeiro (pode ser pelo id do Prisma ou pelo workflowId)
    // Tentar primeiro pelo id do Prisma
    let workflow = await prisma.n8NWorkflow.findUnique({
      where: { id: workflowId },
    })

    // Se não encontrar pelo id, tentar pelo workflowId
    if (!workflow) {
      workflow = await prisma.n8NWorkflow.findUnique({
        where: { workflowId },
      })
    }

    if (!workflow) {
      return NextResponse.json({ status: 'error', message: 'Workflow não encontrado' }, { status: 404 })
    }

    // SUPER_ADMIN em modo admin pode editar qualquer workflow
    // SUPER_ADMIN em modo família e OWNER só da sua família
    if (role === 'SUPER_ADMIN' && context === 'admin') {
      // Pode editar qualquer
    } else if (workflow.familyId !== familyId) {
      return NextResponse.json({ status: 'error', message: 'Não autorizado' }, { status: 403 })
    }

    // Atualizar o workflow usando o id do Prisma
    const updatedWorkflow = await prisma.n8NWorkflow.update({
      where: { id: workflow.id },
      data: { status },
    })

    return NextResponse.json({ status: 'ok', workflow: updatedWorkflow })
  } catch (error) {
    console.error('[N8N_WORKFLOWS_PATCH]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao atualizar workflow', error: String(error) },
      { status: 500 }
    )
  }
}

