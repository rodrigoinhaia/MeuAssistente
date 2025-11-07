import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// GET /api/plans - Lista todos os planos
export async function GET(req: Request) {
  try {
    const contextHeader = req.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const authResult = await requireAuth(req, ['SUPER_ADMIN', 'OWNER'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }
    
    const { role, adminContext: context } = authResult
    
    // Apenas SUPER_ADMIN em modo admin ou OWNER pode ver planos
    // OWNER vê planos para escolher, SUPER_ADMIN em modo admin gerencia planos
    if (role === 'SUPER_ADMIN' && context !== 'admin') {
      return NextResponse.json({ error: 'Acesso apenas no modo Admin' }, { status: 403 })
    }

    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/plans - Cria um novo plano
export async function POST(req: Request) {
  try {
    const contextHeader = req.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const { requireAuth } = await import('@/lib/authorization')
    const authResult = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }
    
    const { role, adminContext: context } = authResult
    
    // Apenas SUPER_ADMIN em modo admin pode criar planos
    if (role !== 'SUPER_ADMIN' || context !== 'admin') {
      return NextResponse.json({ error: 'Apenas Super Admin em modo Admin pode criar planos' }, { status: 403 })
    }

    const data = await req.json()
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        features: data.features,
        maxUsers: data.maxUsers,
        maxStorage: data.maxStorage,
      }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/plans - Atualiza um plano existente
export async function PATCH(req: Request) {
  try {
    const contextHeader = req.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    
    const { requireAuth } = await import('@/lib/authorization')
    const authResult = await requireAuth(req, ['SUPER_ADMIN'], adminContext)
    
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status })
    }
    
    const { role, adminContext: context } = authResult
    
    // Apenas SUPER_ADMIN em modo admin pode atualizar planos
    if (role !== 'SUPER_ADMIN' || context !== 'admin') {
      return NextResponse.json({ error: 'Apenas Super Admin em modo Admin pode atualizar planos' }, { status: 403 })
    }

    const data = await req.json()
    
    // Validação dos dados
    if (!data.id) {
      return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 })
    }

    // Se estiver desativando o plano, verifica se há assinaturas ativas
    if (data.isActive === false) {
      const activeSubscriptions = await prisma.subscription.count({
        where: {
          planId: data.id,
          status: 'active'
        }
      })

      if (activeSubscriptions > 0) {
        return NextResponse.json({
          error: 'Não é possível desativar um plano com assinaturas ativas'
        }, { status: 400 })
      }
    }

    // Verifica se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: data.id }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Prepara os dados para atualização
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description) updateData.description = data.description
    if (typeof data.price === 'number' && data.price > 0) updateData.price = data.price
    if (Array.isArray(data.features)) updateData.features = data.features
    if (typeof data.maxUsers === 'number' && data.maxUsers > 0) updateData.maxUsers = data.maxUsers
    if (typeof data.maxStorage === 'number' && data.maxStorage > 0) updateData.maxStorage = data.maxStorage
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

    // Atualiza o plano
    const plan = await prisma.plan.update({
      where: { id: data.id },
      data: updateData
    })

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Error updating plan:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um plano com este nome' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
