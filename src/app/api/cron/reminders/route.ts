/**
 * Endpoint para executar lembretes de compromissos (chamado por cron job)
 * Configurar no EasyPanel/Vercel para executar a cada 5 minutos
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sendAppointmentReminders } from '@/lib/whatsapp/scheduled-messages'

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

    await sendAppointmentReminders()

    return NextResponse.json({
      status: 'success',
      message: 'Lembretes processados',
    })
  } catch (error) {
    console.error('[CRON_REMINDERS] Erro:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Erro ao processar lembretes',
        error: String(error),
      },
      { status: 500 }
    )
  }
}

