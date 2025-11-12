/**
 * Endpoint para executar resumo diário (chamado por cron job)
 * Configurar no EasyPanel/Vercel para executar às 08:00
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sendDailySummary } from '@/lib/whatsapp/scheduled-messages'

export async function GET(req: Request) {
  try {
    // Verificar autenticação (cron secret)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { status: 'error', message: 'Não autorizado' },
        { status: 401 }
      )
    }

    await sendDailySummary()

    return NextResponse.json({
      status: 'success',
      message: 'Resumo diário enviado',
    })
  } catch (error) {
    console.error('[CRON_DAILY_SUMMARY] Erro:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao enviar resumo diário',
        error: String(error),
      },
      { status: 500 }
    )
  }
}

