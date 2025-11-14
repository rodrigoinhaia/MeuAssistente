import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { createAndSendOTP } from '@/lib/otp';

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
          isVerified: true,
          phone: true,
          createdAt: true,
        } as any,
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
    const serializedUsers = users.map((user: any) => ({
      ...user,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
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
    const { userId, role, isActive, name, email, phone } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }
    
    const { role: userRole, familyId, adminContext: context } = authResult;
    
    console.log('[USERS_PATCH] Dados da requisição:', {
      userRole,
      familyId,
      context,
      userId,
      role,
      isActive,
    });
    
    // Fetch the user to be updated to check their current role and family
    const userToUpdate = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!userToUpdate) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    console.log('[USERS_PATCH] Usuário a ser atualizado:', {
      id: userToUpdate.id,
      email: userToUpdate.email,
      role: userToUpdate.role,
      familyId: userToUpdate.familyId,
      isActive: userToUpdate.isActive,
    });

    // SUPER_ADMIN em modo admin pode editar qualquer usuário (configurações globais)
    // SUPER_ADMIN em modo família só pode editar usuários da sua família (comporta-se como OWNER)
    // OWNER só pode editar usuários da sua família
    if (userRole === 'SUPER_ADMIN' && context === 'admin') {
      // Pode editar qualquer usuário
      console.log('[USERS_PATCH] SUPER_ADMIN em modo admin - permitindo edição de qualquer usuário');
    } else {
      // Verificar se o usuário pertence à mesma família
      if (!familyId) {
        console.error('[USERS_PATCH] FamilyId não encontrado para validação');
        return NextResponse.json({ 
          error: 'FamilyId não encontrado. Não é possível validar permissão.' 
        }, { status: 400 });
      }
      
      if (userToUpdate.familyId !== familyId) {
        console.error('[USERS_PATCH] Usuário não pertence à família:', {
          userFamilyId: userToUpdate.familyId,
          currentFamilyId: familyId,
        });
        return NextResponse.json({ 
          error: 'Usuário não pertence a esta família.' 
        }, { status: 403 });
      }
      
      console.log('[USERS_PATCH] Validação de família passou');
    }

    // Security validations
    console.log('[USERS_PATCH] Validando restrições de segurança...');
    
    if (userToUpdate.role === 'OWNER') {
        console.error('[USERS_PATCH] Tentativa de editar OWNER bloqueada');
        return NextResponse.json({ error: 'O papel de OWNER não pode ser alterado.' }, { status: 403 });
    }
    
    // Permitir editar próprio usuário apenas para name e email (não para role/status)
    if (userToUpdate.id === session?.user?.id) {
      if (role !== undefined || isActive !== undefined) {
        console.error('[USERS_PATCH] Tentativa de editar próprio papel/status bloqueada');
        return NextResponse.json({ error: 'Você não pode alterar seu próprio papel ou status.' }, { status: 403 });
      }
      // Permitir editar nome e email do próprio usuário
    }
    
    // Validar email único se estiver sendo alterado
    if (email && email.toLowerCase() !== userToUpdate.email.toLowerCase()) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          familyId: userToUpdate.familyId,
          NOT: { id: userId },
        },
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'Este e-mail já está em uso por outro usuário nesta família.' 
        }, { status: 400 });
      }
    }
    
    // Normalizar telefone se fornecido
    let normalizedPhone = phone
    if (phone) {
      // Remove caracteres não numéricos
      const digits = phone.replace(/\D/g, '')
      
      // Se já começa com 55, mantém
      if (digits.startsWith('55') && digits.length >= 12) {
        normalizedPhone = digits
      } else {
        // Remove 0 inicial se houver
        const withoutLeadingZero = digits.startsWith('0') ? digits.substring(1) : digits
        
        // Se tem 10 ou 11 dígitos (DDD + número), adiciona 55
        if (withoutLeadingZero.length >= 10 && withoutLeadingZero.length <= 11) {
          normalizedPhone = `55${withoutLeadingZero}`
        } else if (withoutLeadingZero.length >= 12) {
          normalizedPhone = withoutLeadingZero
        } else {
          normalizedPhone = withoutLeadingZero
        }
      }
      
      // Validar formato final
      if (normalizedPhone.length < 12) {
        return NextResponse.json({ 
          error: 'Número de WhatsApp inválido. Deve incluir DDD e número.' 
        }, { status: 400 });
      }
    }
    
    console.log('[USERS_PATCH] Todas as validações passaram, atualizando usuário...');

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: normalizedPhone || null }),
      } as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        isVerified: true,
      } as any,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[USERS_PATCH]', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const contextHeader = request.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  const authResult = await requireAuth(request, ['OWNER', 'SUPER_ADMIN'], adminContext);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: authResult.error.status });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const { role: userRole, familyId, adminContext: context } = authResult;

    // Determinar familyId baseado no contexto
    let targetFamilyId: string | null = null;
    
    if (userRole === 'SUPER_ADMIN' && context === 'admin') {
      // SUPER_ADMIN em modo admin pode criar usuário em qualquer família
      // Se não especificou familyId, usa a família do próprio usuário
      targetFamilyId = body.familyId || familyId;
    } else {
      // OWNER ou SUPER_ADMIN em modo família só pode criar na própria família
      if (!familyId) {
        return NextResponse.json({ 
          error: 'FamilyId não encontrado. Não é possível criar usuário.' 
        }, { status: 400 });
      }
      targetFamilyId = familyId;
    }

    if (!targetFamilyId) {
      return NextResponse.json({ 
        error: 'FamilyId é obrigatório para criar usuário.' 
      }, { status: 400 });
    }

    // Verificar se o email já existe na família
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        familyId: targetFamilyId,
      },
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Este e-mail já está cadastrado nesta família.' 
      }, { status: 400 });
    }

    // Validar role
    const validRoles = ['USER', 'SUPER_ADMIN'];
    const userRoleToCreate = role && validRoles.includes(role) ? role : 'USER';

    // Não permitir criar OWNER
    if (userRoleToCreate === 'OWNER') {
      return NextResponse.json({ 
        error: 'Não é possível criar um usuário com papel de OWNER.' 
      }, { status: 400 });
    }

    // Hash da senha
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    // Nota: cpf e phone são obrigatórios no schema, então geramos valores temporários se não fornecidos
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: userRoleToCreate,
        familyId: targetFamilyId,
        isActive: true,
        isVerified: false, // Usuários criados por admin também precisam verificar
        // Campos obrigatórios do schema - gerar valores temporários se não fornecidos
        cpf: body.cpf || `00000000000`, // CPF temporário - pode ser atualizado depois
        phone: body.phone || `00000000000`, // Telefone temporário - pode ser atualizado depois
      } as any, // Type assertion temporária até o Prisma Client ser totalmente atualizado
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          phone: true,
          createdAt: true,
        } as any,
    });

    // Enviar código OTP via WhatsApp se tiver telefone válido
    const userPhone = body.phone || ''
    if (userPhone && userPhone !== '00000000000') {
      try {
        const userId = typeof (newUser as any).id === 'string' ? (newUser as any).id : String((newUser as any).id)
        await createAndSendOTP(userId, userPhone)
      } catch (otpError) {
        console.error('[USERS_POST] Erro ao enviar OTP:', otpError)
        // Continua mesmo se falhar - usuário pode solicitar reenvio depois
      }
    }

    return NextResponse.json({ 
      status: 'ok',
      message: 'Usuário criado com sucesso! Verifique o WhatsApp para receber o código de verificação.',
      requiresVerification: true,
      user: {
        ...newUser,
        createdAt: (newUser.createdAt instanceof Date) ? newUser.createdAt.toISOString() : newUser.createdAt,
      }
    });
  } catch (error: any) {
    console.error('[USERS_POST]', error);
    
    // Erro de constraint única (email duplicado)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Este e-mail já está cadastrado.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
  }
}