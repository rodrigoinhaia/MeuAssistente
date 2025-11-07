import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

export async function GET(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    const families = await prisma.family.findMany({
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
    return NextResponse.json({ status: 'ok', families })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao buscar famílias', error: String(error) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, ['OWNER', 'ADMIN'])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  try {
    const { id, name, phoneNumber, subscriptionPlan, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ status: 'error', message: 'ID da família é obrigatório.' }, { status: 400 })
    }
    const data: any = {}
    if (name) data.name = name
    if (phoneNumber) data.phoneNumber = phoneNumber
    if (subscriptionPlan) data.subscriptionPlan = subscriptionPlan
    if (typeof isActive === 'boolean') data.isActive = isActive
    const family = await prisma.family.update({
      where: { id },
      data,
    })
    return NextResponse.json({ status: 'ok', message: 'Família atualizada com sucesso!', family })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao atualizar família', error: String(error) }, { status: 500 })
  }
}