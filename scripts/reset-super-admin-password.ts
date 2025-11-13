/**
 * Script para resetar a senha do Super Admin
 * Uso: npx tsx scripts/reset-super-admin-password.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetSuperAdminPassword() {
  try {
    console.log('🔐 Resetando senha do Super Admin...\n')

    const email = 'superadmin@meuassistente.com'
    const newPassword = 'superadmin123'

    // Buscar o usuário
    const user = await prisma.user.findFirst({
      where: { email },
    })

    if (!user) {
      console.error('❌ Super Admin não encontrado!')
      console.log('💡 Execute o seed primeiro: npm run db:seed')
      return
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`)

    // Gerar novo hash da senha
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    console.log(`\n🔑 Gerando novo hash...`)
    console.log(`   - Senha: ${newPassword}`)
    console.log(`   - Hash: ${hashedPassword.substring(0, 20)}...`)

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isActive: true, // Garantir que está ativo
      },
    })

    console.log(`\n✅ Senha resetada com sucesso!`)

    // Verificar se a senha funciona
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (updatedUser) {
      const isValid = await bcrypt.compare(newPassword, updatedUser.password)
      console.log(`\n🧪 Teste de validação:`)
      console.log(`   - Senha válida: ${isValid ? '✅ SIM' : '❌ NÃO'}`)

      if (isValid) {
        console.log(`\n✅ Tudo funcionando!`)
        console.log(`\n📝 Credenciais:`)
        console.log(`   Email: ${email}`)
        console.log(`   Senha: ${newPassword}`)
      } else {
        console.error(`\n❌ Erro: A senha não está funcionando após o reset!`)
      }
    }

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetSuperAdminPassword()

