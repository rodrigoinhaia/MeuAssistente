import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Testa a conexão buscando o primeiro family (ou nada)
    await prisma.family.findFirst()
    return NextResponse.json({ status: 'ok', message: 'Conexão com o banco de dados bem-sucedida!' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao conectar com o banco de dados', error: String(error) }, { status: 500 })
  }
} 