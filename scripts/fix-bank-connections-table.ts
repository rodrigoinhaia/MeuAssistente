/**
 * Script para criar a tabela bank_connections se ela não existir
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBankConnectionsTable() {
  console.log('🔍 Verificando tabela bank_connections...')
  
  try {
    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'bank_connections'
    `
    
    if (tableExists.length > 0) {
      console.log('✅ Tabela bank_connections já existe.')
      return
    }
    
    console.log('⚠️  Tabela bank_connections não encontrada. Criando...')
    
    // Criar a tabela
    await prisma.$executeRaw`
      CREATE TABLE "bank_connections" (
        "id" TEXT NOT NULL,
        "family_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "institution_name" TEXT NOT NULL,
        "institution_id" TEXT NOT NULL,
        "account_id" TEXT,
        "account_type" TEXT,
        "account_number" TEXT,
        "access_token" TEXT NOT NULL,
        "refresh_token" TEXT,
        "expires_at" TIMESTAMP(3),
        "consent_id" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "last_sync_at" TIMESTAMP(3),
        "auto_sync" BOOLEAN NOT NULL DEFAULT true,
        "config" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
      )
    `
    
    console.log('✅ Tabela bank_connections criada.')
    
    // Criar foreign keys
    console.log('⚠️  Criando foreign keys...')
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "bank_connections" 
        ADD CONSTRAINT "bank_connections_family_id_fkey" 
        FOREIGN KEY ("family_id") 
        REFERENCES "families"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `
      console.log('  ✅ Foreign key para families criada.')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('  ⏭️  Foreign key para families já existe.')
      } else {
        console.error('  ❌ Erro ao criar foreign key para families:', error.message)
      }
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "bank_connections" 
        ADD CONSTRAINT "bank_connections_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `
      console.log('  ✅ Foreign key para users criada.')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('  ⏭️  Foreign key para users já existe.')
      } else {
        console.error('  ❌ Erro ao criar foreign key para users:', error.message)
      }
    }
    
    // Criar foreign key na tabela transactions (se ainda não existir)
    const fkExists = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'transactions' 
        AND constraint_name = 'transactions_bank_connection_id_fkey'
    `
    
    if (fkExists.length === 0) {
      console.log('⚠️  Criando foreign key na tabela transactions...')
      try {
        await prisma.$executeRaw`
          ALTER TABLE "transactions" 
          ADD CONSTRAINT "transactions_bank_connection_id_fkey" 
          FOREIGN KEY ("bank_connection_id") 
          REFERENCES "bank_connections"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
        `
        console.log('  ✅ Foreign key na tabela transactions criada.')
      } catch (error: any) {
        console.error('  ❌ Erro ao criar foreign key na tabela transactions:', error.message)
      }
    } else {
      console.log('  ✅ Foreign key na tabela transactions já existe.')
    }
    
    console.log('✅ Script concluído com sucesso!')
    
  } catch (error: any) {
    console.error('❌ Erro ao corrigir tabela:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixBankConnectionsTable()
  .then(() => {
    console.log('✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

