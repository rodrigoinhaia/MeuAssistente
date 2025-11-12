/**
 * Endpoint para executar resumo semanal (chamado por cron job)
 * Configurar no EasyPanel/Vercel para executar aos domingos às 20:00
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sendWeeklySummary } from '@/lib/whatsapp/scheduled-messages'

export async function GET(req: Request) {
  try {
    // Verificar autenticação (cron secret)
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { status: 'error', message: 'Não autorizado' },
        { status: 401 }
      )
    }

    await sendWeeklySummary()

    return NextResponse.json({
      status: 'success',
      message: 'Resumo semanal enviado',
    })
  } catch (error) {
    console.error('[CRON_WEEKLY_SUMMARY] Erro:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao enviar resumo semanal',
        error: String(error),
      },
      { status: 500 }
    )
  }
}

