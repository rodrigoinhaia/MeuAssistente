import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json({ status: 'error', message: 'Telefone e código são obrigatórios.' }, { status: 400 })
    }
    const redisKey = `wa_code:${phone}`
    const storedCode = await redis.get(redisKey)
    if (!storedCode) {
      return NextResponse.json({ status: 'error', message: 'Código não encontrado ou expirado. Solicite um novo código.' }, { status: 400 })
    }
    if (storedCode !== code) {
      return NextResponse.json({ status: 'error', message: 'Código inválido.' }, { status: 400 })
    }
    // Código válido, pode prosseguir
    await redis.del(redisKey)
    return NextResponse.json({ status: 'ok', message: 'WhatsApp verificado com sucesso!' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao verificar código', error: String(error) }, { status: 500 })
  }
} 