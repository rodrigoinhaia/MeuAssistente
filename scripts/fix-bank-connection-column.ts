/**
 * Script para adicionar a coluna bank_connection_id se ela não existir
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixBankConnectionColumn() {
  console.log('🔍 Verificando coluna bank_connection_id...')
  
  try {
    // Verificar se a coluna existe
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
        AND column_name = 'bank_connection_id'
    `
    
    if (result.length > 0) {
      console.log('✅ Coluna bank_connection_id já existe.')
      return
    }
    
    console.log('⚠️  Coluna bank_connection_id não encontrada. Criando...')
    
    // Adicionar a coluna
    await prisma.$executeRaw`
      ALTER TABLE "transactions" 
      ADD COLUMN IF NOT EXISTS "bank_connection_id" TEXT
    `
    
    console.log('✅ Coluna bank_connection_id criada.')
    
    // Verificar se bank_transaction_id também existe
    const result2 = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
        AND column_name = 'bank_transaction_id'
    `
    
    if (result2.length === 0) {
      console.log('⚠️  Coluna bank_transaction_id não encontrada. Criando...')
      await prisma.$executeRaw`
        ALTER TABLE "transactions" 
        ADD COLUMN IF NOT EXISTS "bank_transaction_id" TEXT
      `
      console.log('✅ Coluna bank_transaction_id criada.')
    }
    
    // Verificar se a foreign key existe
    const fkResult = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'transactions' 
        AND constraint_name = 'transactions_bank_connection_id_fkey'
    `
    
    if (fkResult.length === 0) {
      console.log('⚠️  Foreign key não encontrada. Criando...')
      // Verificar se a tabela bank_connections existe
      const tableExists = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'bank_connections'
      `
      
      if (tableExists.length > 0) {
        await prisma.$executeRaw`
          ALTER TABLE "transactions" 
          ADD CONSTRAINT "transactions_bank_connection_id_fkey" 
          FOREIGN KEY ("bank_connection_id") 
          REFERENCES "bank_connections"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE
        `
        console.log('✅ Foreign key criada.')
      } else {
        console.log('⚠️  Tabela bank_connections não existe. Pulando criação da foreign key.')
      }
    } else {
      console.log('✅ Foreign key já existe.')
    }
    
    console.log('✅ Script concluído com sucesso!')
    
  } catch (error: any) {
    console.error('❌ Erro ao corrigir coluna:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixBankConnectionColumn()
  .then(() => {
    console.log('✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

