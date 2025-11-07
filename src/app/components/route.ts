import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  // Apenas SUPER_ADMIN pode listar todas as famílias (clientes)
  const { session, error } = await requireAuth(req, ['SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    // Corrigido de 'family' para 'family'
    const clients = await prisma.family.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        subscriptionPlan: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ status: 'ok', clients })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar clientes', error: String(error) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  // Apenas SUPER_ADMIN pode editar famílias (clientes)
  const { session, error } = await requireAuth(req, ['SUPER_ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    const { id, name, phoneNumber, subscriptionPlan, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID do cliente é obrigatório.' }, { status: 400 })
    }
    const data: any = {}
    if (name) data.name = name
    if (phoneNumber) data.phoneNumber = phoneNumber
    if (subscriptionPlan) data.subscriptionPlan = subscriptionPlan
    if (typeof isActive === 'boolean') data.isActive = isActive
    // Corrigido de 'family' para 'family'
    const client = await prisma.family.update({
      where: { id },
      data,
    })
    return NextResponse.json({ status: 'ok', message: 'Cliente atualizado com sucesso!', client })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar cliente', error: String(error) }, { status: 500 })
  }
} 