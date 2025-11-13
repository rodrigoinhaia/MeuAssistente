/**
 * Script de migração para adicionar verificação OTP via WhatsApp
 * Execute: npx tsx scripts/migrate-otp-verification.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('🔄 Iniciando migração de verificação OTP...\n')

    // 1. Verificar se a coluna isVerified existe
    console.log('1️⃣ Verificando campo isVerified...')
    const checkColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_verified'
    `

    if (checkColumn.length === 0) {
      console.log('   ➕ Adicionando campo is_verified...')
      await prisma.$executeRaw`
        ALTER TABLE users 
        ADD COLUMN is_verified BOOLEAN DEFAULT false
      `
      console.log('   ✅ Campo is_verified adicionado')
    } else {
      console.log('   ✅ Campo is_verified já existe')
    }

    // 2. Verificar se a tabela otp_verifications existe
    console.log('\n2️⃣ Verificando tabela otp_verifications...')
    const checkTable = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'otp_verifications'
    `

    if (checkTable.length === 0) {
      console.log('   ➕ Criando tabela otp_verifications...')
      await prisma.$executeRaw`
        CREATE TABLE otp_verifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code TEXT NOT NULL,
          phone TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          verified_at TIMESTAMP
        )
      `
      console.log('   ✅ Tabela otp_verifications criada')
    } else {
      console.log('   ✅ Tabela otp_verifications já existe')
    }

    // 3. Criar índices se não existirem
    console.log('\n3️⃣ Verificando índices...')
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_verifications(user_id)
      `
      console.log('   ✅ Índice idx_otp_user_id criado/verificado')
    } catch (e: any) {
      if (!e.message?.includes('already exists')) {
        throw e
      }
      console.log('   ✅ Índice idx_otp_user_id já existe')
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON otp_verifications(phone, code)
      `
      console.log('   ✅ Índice idx_otp_phone_code criado/verificado')
    } catch (e: any) {
      if (!e.message?.includes('already exists')) {
        throw e
      }
      console.log('   ✅ Índice idx_otp_phone_code já existe')
    }

    // 4. Marcar usuários existentes como verificados (para não bloquear)
    console.log('\n4️⃣ Atualizando usuários existentes...')
    const result = await prisma.$executeRaw`
      UPDATE users 
      SET is_verified = true 
      WHERE is_verified IS NULL OR is_verified = false
    `
    console.log(`   ✅ ${result} usuário(s) marcado(s) como verificado(s)`)

    // 5. Verificar se tudo está correto
    console.log('\n5️⃣ Verificando estrutura final...')
    const usersCount = await prisma.user.count()
    const verifiedCount = await prisma.user.count({
      where: { isVerified: true },
    })
    const unverifiedCount = await prisma.user.count({
      where: { isVerified: false },
    })

    console.log(`   📊 Estatísticas:`)
    console.log(`      - Total de usuários: ${usersCount}`)
    console.log(`      - Verificados: ${verifiedCount}`)
    console.log(`      - Não verificados: ${unverifiedCount}`)

    console.log('\n✅ Migração concluída com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Configure as variáveis de ambiente para envio de WhatsApp')
    console.log('   2. Novos usuários precisarão verificar via OTP')
    console.log('   3. Usuários existentes já estão marcados como verificados')
  } catch (error) {
    console.error('\n❌ Erro na migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()

