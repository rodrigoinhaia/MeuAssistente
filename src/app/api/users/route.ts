import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['OWNER', 'ADMIN']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
  }

  const { familyId } = authResult;

  try {
    const users = await prisma.user.findMany({
      where: {
        familyId: familyId,
      },
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
  const authResult = await requireAuth(request, ['OWNER', 'ADMIN']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
  }

  try {
    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }
    
    // Fetch the user to be updated to check their current role and family
    const userToUpdate = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!userToUpdate || userToUpdate.familyId !== authResult.familyId) {
        return NextResponse.json({ error: 'Usuário não encontrado ou não pertence a esta família.' }, { status: 404 });
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