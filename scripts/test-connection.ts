import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n')

  try {
    // 1. Testar conexão básica
    console.log('1️⃣ Testando conexão básica...')
    await prisma.$connect()
    console.log('✅ Conexão estabelecida com sucesso!\n')

    // 2. Verificar se existem famílias
    console.log('2️⃣ Verificando famílias...')
    const families = await prisma.family.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        _count: {
          select: { users: true }
        }
      }
    })
    console.log(`✅ Encontradas ${families.length} família(s):`)
    families.forEach(f => {
      console.log(`   - ${f.name} (${f.phoneNumber}) - ${f.isActive ? 'Ativa' : 'Inativa'} - ${f._count.users} usuário(s)`)
    })
    console.log()

    // 3. Verificar usuário admin@teste.com especificamente
    console.log('3️⃣ Verificando usuário admin@teste.com...')
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@teste.com'
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!adminUser) {
      console.log('❌ Usuário admin@teste.com NÃO encontrado!')
      console.log('💡 Execute: npx prisma db seed\n')
    } else {
      console.log('✅ Usuário encontrado:')
      console.log(`   - Nome: ${adminUser.name}`)
      console.log(`   - Email: ${adminUser.email}`)
      console.log(`   - Role: ${adminUser.role}`)
      console.log(`   - Ativo: ${adminUser.isActive ? 'Sim' : 'Não'}`)
      console.log(`   - Família: ${adminUser.family.name} (${adminUser.family.isActive ? 'Ativa' : 'Inativa'})`)
      console.log()

      // 4. Testar senha
      console.log('4️⃣ Testando senha...')
      const testPassword = 'admin123'
      const isValid = await bcrypt.compare(testPassword, adminUser.password)
      console.log(`   Senha "admin123" é válida: ${isValid ? '✅ Sim' : '❌ Não'}`)
      console.log()

      // 5. Verificar se pode fazer login (simular query de autenticação)
      console.log('5️⃣ Simulando query de autenticação...')
      const authUser = await prisma.user.findFirst({
        where: {
          email: 'admin@teste.com',
          isActive: true,
          family: {
            isActive: true
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          family: {
            select: {
              isActive: true
            }
          }
        }
      })

      if (authUser) {
        console.log('✅ Usuário pode fazer login!')
        console.log(`   - ID: ${authUser.id}`)
        console.log(`   - Role: ${authUser.role}`)
      } else {
        console.log('❌ Usuário NÃO pode fazer login!')
        if (!adminUser.isActive) {
          console.log('   ⚠️  Motivo: Usuário está INATIVO')
        }
        if (!adminUser.family.isActive) {
          console.log('   ⚠️  Motivo: Família está INATIVA')
        }
      }
      console.log()
    }

    // 6. Listar todos os usuários
    console.log('6️⃣ Listando todos os usuários...')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        family: {
          select: {
            name: true,
            isActive: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    })
    console.log(`✅ Total de ${allUsers.length} usuário(s):`)
    allUsers.forEach(u => {
      const status = u.isActive && u.family.isActive ? '✅' : '❌'
      console.log(`   ${status} ${u.email} (${u.role}) - ${u.name} - Família: ${u.family.name} ${u.family.isActive ? '(Ativa)' : '(Inativa)'}`)
    })
    console.log()

    console.log('✅ Teste concluído com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

