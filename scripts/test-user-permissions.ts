/**
 * Script para testar permissões de edição de usuários
 * Uso: npx tsx scripts/test-user-permissions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testUserPermissions() {
  try {
    console.log('🔍 Testando permissões de usuários...\n')

    // Buscar super admin
    const superAdmin = await prisma.user.findFirst({
      where: { email: 'superadmin@meuassistente.com' },
      include: { family: true },
    })

    if (!superAdmin) {
      console.error('❌ Super Admin não encontrado!')
      return
    }

    console.log('✅ Super Admin encontrado:')
    console.log(`   - ID: ${superAdmin.id}`)
    console.log(`   - Email: ${superAdmin.email}`)
    console.log(`   - Role: ${superAdmin.role}`)
    console.log(`   - Family ID: ${superAdmin.familyId}`)
    console.log(`   - Family Name: ${superAdmin.family.name}`)

    // Buscar usuários da mesma família
    const usersInFamily = await prisma.user.findMany({
      where: { familyId: superAdmin.familyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    console.log(`\n👥 Usuários na mesma família (${usersInFamily.length}):`)
    usersInFamily.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Ativo' : 'Inativo'}`)
    })

    // Verificar quais usuários podem ser editados
    console.log(`\n✏️  Usuários que podem ser editados pelo Super Admin:`)
    usersInFamily.forEach((user) => {
      const canEdit = 
        user.id !== superAdmin.id && // Não pode editar a si mesmo
        user.role !== 'OWNER' // Não pode editar OWNER
      
      console.log(`   - ${user.name}: ${canEdit ? '✅ PODE' : '❌ NÃO PODE'} ${!canEdit ? `(${user.id === superAdmin.id ? 'É você mesmo' : 'É OWNER'})` : ''}`)
    })

    // Buscar usuários de outras famílias
    const otherFamilies = await prisma.family.findMany({
      where: { id: { not: superAdmin.familyId } },
      take: 3,
    })

    if (otherFamilies.length > 0) {
      console.log(`\n👥 Usuários de outras famílias:`)
      for (const family of otherFamilies) {
        const users = await prisma.user.findMany({
          where: { familyId: family.id },
          take: 2,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })
        
        users.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.role} - Família: ${family.name}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserPermissions()

