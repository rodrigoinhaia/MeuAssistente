import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  const contextHeader = request.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const authResult = await requireAuth(request, ['OWNER', 'SUPER_ADMIN'], adminContext);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
  }

  const { role, familyId, adminContext: context } = authResult;

  try {
    // SUPER_ADMIN em modo admin vê todos os usuários (apenas para configurações)
    // SUPER_ADMIN em modo família vê apenas usuários da sua família (comporta-se como OWNER)
    const whereClause = (role === 'SUPER_ADMIN' && context === 'admin') ? {} : { familyId };
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[USERS_GET]', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const contextHeader = request.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const authResult = await requireAuth(request, ['OWNER', 'SUPER_ADMIN'], adminContext);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
  }

  try {
    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }
    
    const { role: userRole, familyId, adminContext: context } = authResult;
    
    // Fetch the user to be updated to check their current role and family
    const userToUpdate = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!userToUpdate) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // SUPER_ADMIN em modo admin pode editar qualquer usuário (configurações globais)
    // SUPER_ADMIN em modo família só pode editar usuários da sua família (comporta-se como OWNER)
    if (userRole === 'SUPER_ADMIN' && context === 'admin') {
      // Pode editar qualquer usuário
    } else if (userToUpdate.familyId !== familyId) {
      return NextResponse.json({ error: 'Usuário não pertence a esta família.' }, { status: 403 });
    }

    // Security validations
    if (userToUpdate.role === 'OWNER') {
        return NextResponse.json({ error: 'O papel de OWNER não pode ser alterado.' }, { status: 403 });
    }
    if (userToUpdate.id === session?.user?.id) {
        return NextResponse.json({ error: 'Você não pode alterar seu próprio papel ou status.' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[USERS_PATCH]', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}