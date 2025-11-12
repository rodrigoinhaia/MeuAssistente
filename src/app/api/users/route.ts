import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  console.log('[USERS_GET] Iniciando requisição');
  try {
    const contextHeader = request.headers.get('x-admin-context')
    const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
    console.log('[USERS_GET] Contexto:', adminContext);
    
    let authResult
    try {
      authResult = await requireAuth(request, ['OWNER', 'SUPER_ADMIN'], adminContext);
    } catch (authError: any) {
      console.error('[USERS_GET] Erro ao chamar requireAuth:', {
        message: authError?.message,
        stack: authError?.stack,
      });
      return NextResponse.json(
        { status: 'error', error: 'Erro ao verificar autenticação', message: authError?.message || String(authError) },
        { status: 500 }
      );
    }

    if (authResult.error) {
      console.error('[USERS_GET] Erro de autenticação:', authResult.error);
      return NextResponse.json(
        { status: 'error', error: authResult.error.message }, 
        { status: authResult.error.status }
      );
    }

    const { role, familyId, adminContext: context } = authResult;

    // Validar familyId se não for SUPER_ADMIN em modo admin
    if (role !== 'SUPER_ADMIN' || context !== 'admin') {
      if (!familyId) {
        return NextResponse.json(
          { status: 'error', error: 'FamilyId não encontrado na sessão' },
          { status: 400 }
        );
      }
    }

    // SUPER_ADMIN em modo admin vê todos os usuários (apenas para configurações)
    // SUPER_ADMIN em modo família vê apenas usuários da sua família (comporta-se como OWNER)
    let whereClause: any
    if (role === 'SUPER_ADMIN' && context === 'admin') {
      // SUPER_ADMIN em modo admin: ver todos os usuários
      whereClause = {}
    } else {
      // Outros casos: filtrar por familyId
      if (!familyId) {
        console.error('[USERS_GET] FamilyId é obrigatório para este contexto', { role, context, familyId });
        return NextResponse.json(
          { status: 'error', error: 'FamilyId não encontrado na sessão' },
          { status: 400 }
        );
      }
      whereClause = { familyId }
    }
    
    console.log('[USERS_GET] Query:', {
      whereClause,
      role,
      familyId: familyId || 'null',
      context,
    });
    
    let users
    try {
      users = await prisma.user.findMany({
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
      console.log('[USERS_GET] Encontrados:', users.length, 'usuários');
    } catch (prismaError: any) {
      console.error('[USERS_GET] Erro do Prisma:', {
        message: prismaError?.message,
        code: prismaError?.code,
        meta: prismaError?.meta,
        stack: prismaError?.stack,
      });
      
      // Se o erro for relacionado a roles inválidos, tentar corrigir e retornar vazio
      if (prismaError?.message?.includes("not found in enum 'UserRole'")) {
        console.error('[USERS_GET] ⚠️  Há usuários com roles inválidos no banco. Execute: npx tsx scripts/fix-admin-role.ts');
        return NextResponse.json(
          { 
            status: 'error', 
            error: 'Erro ao buscar usuários. Há usuários com roles inválidos no banco. Execute o script de correção.',
            message: 'Execute: npx tsx scripts/fix-admin-role.ts para corrigir os dados.'
          }, 
          { status: 500 }
        );
      }
      
      throw prismaError;
    }

    // Serializar datas para JSON
    const serializedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({ status: 'ok', users: serializedUsers });
  } catch (error: any) {
    console.error('[USERS_GET] Erro completo:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta,
      name: error?.name,
    });
    
    // Se já foi uma resposta de erro, retornar ela
    if (error?.status && error?.response) {
      return error.response;
    }
    
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Erro ao buscar usuários.',
        message: error?.message || String(error)
      }, 
      { status: 500 }
    );
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