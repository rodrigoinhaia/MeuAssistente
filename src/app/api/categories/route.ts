import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    // SUPER_ADMIN vê todas as categorias, outros roles só da sua família
    const whereClause = role === 'SUPER_ADMIN' ? {} : { familyId }
    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ status: 'ok', categories })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar categorias', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  try {
    const { name, type, color = '#3B82F6', icon, familyId: bodyFamilyId } = await req.json()
    if (!name || !type) {
      return NextResponse.json({ status: 'error', message: 'Nome e tipo são obrigatórios.' }, { status: 400 })
    }
    
    // SUPER_ADMIN pode criar categoria para qualquer família (deve especificar no body)
    // Outros roles só podem criar para sua própria família
    const finalFamilyId = role === 'SUPER_ADMIN' 
      ? (bodyFamilyId || familyId) // SUPER_ADMIN pode especificar familyId no body, senão usa da sessão
      : familyId // Outros roles sempre usam familyId da sessão
    
    if (!finalFamilyId) {
      return NextResponse.json({ status: 'error', message: 'familyId é obrigatório.' }, { status: 400 })
    }
    
    // Verifica unicidade por family, nome e tipo
    const exists = await prisma.category.findFirst({ where: { familyId: finalFamilyId, name, type } })
    if (exists) {
      return NextResponse.json({ status: 'error', message: 'Categoria já existe para este tipo.' }, { status: 400 })
    }
    const category = await prisma.category.create({
      data: { name, type, color, icon, familyId: finalFamilyId },
    })
    return NextResponse.json({ status: 'ok', category })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao criar categoria', error: String(error) }, { status: 500 })
  }
} 