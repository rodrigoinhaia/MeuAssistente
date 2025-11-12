import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Endpoint de health check para diagnosticar problemas
 */
export async function GET(req: Request) {
  try {
    // Testar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      message: 'Sistema operacional',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error: any) {
    console.error('[HEALTH_CHECK]', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro no health check',
        error: error?.message || String(error),
        database: 'disconnected',
      },
      { status: 500 }
    )
  }
}

