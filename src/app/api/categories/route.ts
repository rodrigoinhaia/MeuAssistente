import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, [], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  // SUPER_ADMIN em modo admin NÃO pode ver categorias (apenas configurações globais)
  if (role === 'SUPER_ADMIN' && context === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Categorias são dados familiares e não estão disponíveis no modo Admin.' },
      { status: 403 }
    )
  }
  
  try {
    // SUPER_ADMIN em modo família vê apenas categorias da sua família (comporta-se como OWNER)
    // Outros roles vêem apenas categorias da sua família
    if (!familyId) {
      return NextResponse.json({ status: 'error', message: 'Família não identificada' }, { status: 403 })
    }

    const validFamilyId: string = familyId

    const categories = await prisma.category.findMany({
      where: { familyId: validFamilyId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ status: 'ok', categories })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar categorias', error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Apenas OWNER e SUPER_ADMIN podem criar categorias
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  const { session, role, familyId, error, adminContext: context } = await requireAuth(req, ['OWNER', 'SUPER_ADMIN'], adminContext)
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  
  // SUPER_ADMIN em modo admin NÃO pode criar categorias (apenas configurações globais)
  if (role === 'SUPER_ADMIN' && context === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Categorias são dados familiares e não estão disponíveis no modo Admin.' },
      { status: 403 }
    )
  }
  
  try {
    const { name, type, color = '#3B82F6', icon, familyId: bodyFamilyId } = await req.json()
    if (!name || !type) {
      return NextResponse.json({ status: 'error', message: 'Nome e tipo são obrigatórios.' }, { status: 400 })
    }
    
    // SUPER_ADMIN em modo família pode criar categoria para qualquer família (deve especificar no body)
    // OWNER só pode criar para sua própria família
    const finalFamilyId = (role === 'SUPER_ADMIN' && context === 'family')
      ? (bodyFamilyId || familyId) // SUPER_ADMIN pode especificar familyId no body, senão usa da sessão
      : familyId // OWNER sempre usa familyId da sessão
    
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