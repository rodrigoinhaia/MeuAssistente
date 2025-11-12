/**
 * Script para corrigir usuários com role 'ADMIN' no banco de dados
 * Converte todos os usuários com role 'ADMIN' para 'OWNER'
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAdminRole() {
  console.log('🔍 Verificando usuários com role ADMIN...')
  
  try {
    // Usar raw SQL para encontrar usuários com role 'ADMIN'
    const usersWithAdmin = await prisma.$queryRaw<Array<{ id: string; email: string; role: string }>>`
      SELECT id, email, role::text as role
      FROM users
      WHERE role::text = 'ADMIN'
    `
    
    if (usersWithAdmin.length === 0) {
      console.log('✅ Nenhum usuário com role ADMIN encontrado.')
      return
    }
    
    console.log(`⚠️  Encontrados ${usersWithAdmin.length} usuário(s) com role ADMIN:`)
    usersWithAdmin.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`)
    })
    
    // Atualizar usando raw SQL para evitar problemas com o enum
    const result = await prisma.$executeRaw`
      UPDATE users
      SET role = 'OWNER'::"UserRole"
      WHERE role::text = 'ADMIN'
    `
    
    console.log(`✅ ${result} usuário(s) atualizado(s) para OWNER.`)
    
    // Verificar se ainda há usuários com role inválido
    const remaining = await prisma.$queryRaw<Array<{ id: string; email: string; role: string }>>`
      SELECT id, email, role::text as role
      FROM users
      WHERE role::text NOT IN ('SUPER_ADMIN', 'OWNER', 'USER')
    `
    
    if (remaining.length > 0) {
      console.log(`⚠️  Ainda há ${remaining.length} usuário(s) com roles inválidos:`)
      remaining.forEach(user => {
        console.log(`  - ${user.email} (${user.id}) - Role: ${user.role}`)
      })
    } else {
      console.log('✅ Todos os usuários têm roles válidos.')
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao corrigir roles:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminRole()
  .then(() => {
    console.log('✅ Script concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

