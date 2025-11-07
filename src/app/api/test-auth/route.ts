import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email') || 'admin@teste.com'
    const password = searchParams.get('password') || 'admin123'

    console.log(`🔍 Testando autenticação para: ${email}`)

    // Simular exatamente o que o authOptions faz
    const userWithfamily = await prisma.user.findFirst({
      where: {
        email: email,
        isActive: true,
        family: {
          isActive: true
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        familyId: true,
        role: true,
        isActive: true,
        family: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        }
      }
    })

    if (!userWithfamily) {
      return NextResponse.json({
        status: 'error',
        message: 'Usuário não encontrado ou inativo',
        details: {
          email,
          userExists: false,
          possibleReasons: [
            'Usuário não existe no banco',
            'Usuário está inativo (isActive = false)',
            'Família está inativa (isActive = false)'
          ]
        }
      }, { status: 404 })
    }

    // Testar senha
    const isValidPassword = await bcrypt.compare(password, userWithfamily.password)

    if (!isValidPassword) {
      return NextResponse.json({
        status: 'error',
        message: 'Senha inválida',
        details: {
          email,
          userExists: true,
          userActive: userWithfamily.isActive,
          familyActive: userWithfamily.family.isActive,
          passwordValid: false
        }
      }, { status: 401 })
    }

    // Sucesso!
    return NextResponse.json({
      status: 'ok',
      message: 'Autenticação bem-sucedida!',
      user: {
        id: userWithfamily.id,
        name: userWithfamily.name,
        email: userWithfamily.email,
        role: userWithfamily.role,
        isActive: userWithfamily.isActive,
        family: {
          id: userWithfamily.family.id,
          name: userWithfamily.family.name,
          isActive: userWithfamily.family.isActive
        }
      },
      details: {
        userExists: true,
        userActive: userWithfamily.isActive,
        familyActive: userWithfamily.family.isActive,
        passwordValid: true
      }
    })

  } catch (error) {
    console.error('[TEST_AUTH]', error)
    return NextResponse.json({
      status: 'error',
      message: 'Erro ao testar autenticação',
      error: String(error)
    }, { status: 500 })
  }
}

