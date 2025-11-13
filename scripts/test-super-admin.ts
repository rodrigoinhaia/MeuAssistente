/**
 * Script para testar o super admin
 * Uso: npx tsx scripts/test-super-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testSuperAdmin() {
  try {
    console.log('🔍 Verificando Super Admin...\n')

    // 1. Verificar se o usuário existe
    const superAdmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@meuassistente.com',
      },
      include: {
        family: true,
      },
    })

    if (!superAdmin) {
      console.error('❌ Super Admin não encontrado!')
      console.log('💡 Execute o seed: npm run db:seed')
      return
    }

    console.log('✅ Super Admin encontrado:')
    console.log(`   - Nome: ${superAdmin.name}`)
    console.log(`   - Email: ${superAdmin.email}`)
    console.log(`   - Role: ${superAdmin.role}`)
    console.log(`   - isActive: ${superAdmin.isActive}`)
    console.log(`   - Family ID: ${superAdmin.familyId}`)
    console.log(`   - Family Name: ${superAdmin.family.name}`)
    console.log(`   - Family isActive: ${superAdmin.family.isActive}`)

    // 2. Verificar senha
    const testPassword = 'superadmin123'
    const isValidPassword = await bcrypt.compare(testPassword, superAdmin.password)
    
    console.log(`\n🔐 Teste de senha:`)
    console.log(`   - Senha testada: ${testPassword}`)
    console.log(`   - Senha válida: ${isValidPassword ? '✅ SIM' : '❌ NÃO'}`)

    // 3. Verificar condições para login
    console.log(`\n📋 Verificações para login:`)
    const checks = {
      userExists: !!superAdmin,
      userActive: superAdmin.isActive,
      familyActive: superAdmin.family.isActive,
      passwordValid: isValidPassword,
    }

    Object.entries(checks).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value ? '✅' : '❌'}`)
    })

    const canLogin = Object.values(checks).every(v => v === true)

    if (canLogin) {
      console.log(`\n✅ Super Admin pode fazer login!`)
      console.log(`\n📝 Credenciais:`)
      console.log(`   Email: superadmin@meuassistente.com`)
      console.log(`   Senha: superadmin123`)
    } else {
      console.log(`\n❌ Super Admin NÃO pode fazer login!`)
      console.log(`\n🔧 Correções necessárias:`)
      if (!superAdmin.isActive) {
        console.log(`   - Ativar usuário: UPDATE users SET is_active = true WHERE email = 'superadmin@meuassistente.com'`)
      }
      if (!superAdmin.family.isActive) {
        console.log(`   - Ativar família: UPDATE families SET is_active = true WHERE id = '${superAdmin.familyId}'`)
      }
      if (!isValidPassword) {
        console.log(`   - Resetar senha: Execute o seed novamente`)
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar Super Admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSuperAdmin()

