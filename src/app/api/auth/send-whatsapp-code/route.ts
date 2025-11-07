import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ status: 'error', message: 'Telefone é obrigatório.' }, { status: 400 })
    }
    const code = generateCode()
    const expires = 5 * 60 // 5 minutos em segundos
    await redis.set(`wa_code:${phone}`, code, 'EX', expires)

    // Aqui você integraria com a API do WhatsApp Business para enviar o código
    // Exemplo: await sendWhatsAppMessage(phone, `Seu código de verificação: ${code}`)
    console.log(`[DEBUG] Código de verificação para ${phone}: ${code}`)

    return NextResponse.json({ status: 'ok', message: 'Código enviado para o WhatsApp.' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao enviar código', error: String(error) }, { status: 500 })
  }
} 