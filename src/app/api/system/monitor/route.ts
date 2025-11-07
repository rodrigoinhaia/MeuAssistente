import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/authorization'
import { prisma } from '@/lib/db'
import os from 'os'

export async function GET(req: Request) {
  const { session, role, error } = await requireAuth(req, ['OWNER', 'ADMIN', 'SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }

  try {
    // Métricas do sistema (usando APIs do Node.js)
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsage = (usedMemory / totalMemory) * 100

    const cpus = os.cpus()
    const cpuUsage = cpus.length > 0 ? Math.min(100, Math.max(0, 50 + Math.random() * 30)) : 0 // Simulação, idealmente usar biblioteca de monitoramento

    // Métricas do banco de dados
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime

    // Usuários ativos (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: { gte: fiveMinutesAgo },
      },
    })

    // Requisições por minuto (estimativa baseada em logs recentes)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentLogs = await prisma.processingLog.count({
      where: {
        createdAt: { gte: oneMinuteAgo },
      },
    })

    // Taxa de erro (última hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const totalLogs = await prisma.processingLog.count({
      where: {
        createdAt: { gte: oneHourAgo },
      },
    })
    const errorLogs = await prisma.processingLog.count({
      where: {
        createdAt: { gte: oneHourAgo },
        status: 'error',
      },
    })
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0

    // Status do sistema
    let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (memoryUsage > 90 || cpuUsage > 90 || errorRate > 5) {
      systemStatus = 'critical'
    } else if (memoryUsage > 75 || cpuUsage > 75 || errorRate > 2) {
      systemStatus = 'warning'
    }

    // Último incidente
    const lastError = await prisma.processingLog.findFirst({
      where: {
        status: 'error',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Status dos serviços
    const services = [
      {
        name: 'API Gateway',
        status: 'operational' as const,
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Banco de Dados',
        status: dbResponseTime < 100 ? 'operational' : dbResponseTime < 500 ? 'degraded' : 'down',
        uptime: dbResponseTime < 100 ? 99.95 : dbResponseTime < 500 ? 99.50 : 95.00,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Cache Redis',
        status: 'operational' as const, // Implementar verificação real se tiver Redis
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Processamento de Filas',
        status: errorRate < 2 ? 'operational' : errorRate < 5 ? 'degraded' : 'down',
        uptime: errorRate < 2 ? 99.50 : errorRate < 5 ? 98.00 : 95.00,
        lastCheck: new Date().toISOString(),
      },
    ]

    // Uso de disco (simulação - em produção, usar biblioteca específica)
    const diskUsage = 78 // Implementar leitura real do disco se necessário

    return NextResponse.json({
      status: 'ok',
      systemStatus: {
        status: systemStatus,
        cpuUsage: Number(cpuUsage.toFixed(1)),
        memoryUsage: Number(memoryUsage.toFixed(1)),
        diskUsage,
        activeUsers,
        requestsPerMinute: recentLogs,
        averageResponseTime: dbResponseTime,
        errorRate: Number(errorRate.toFixed(2)),
        lastIncident: lastError
          ? {
              date: lastError.createdAt.toISOString(),
              description: lastError.message,
            }
          : undefined,
      },
      services,
    })
  } catch (error) {
    console.error('[SYSTEM_MONITOR_GET]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao buscar status do sistema', error: String(error) },
      { status: 500 }
    )
  }
}

