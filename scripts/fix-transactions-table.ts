/**
 * Script para corrigir a tabela transactions - adicionar colunas faltantes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTransactionsTable() {
  console.log('🔍 Verificando colunas da tabela transactions...')
  
  try {
    // Verificar colunas existentes
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY column_name
    `
    
    const existingColumns = columns.map(c => c.column_name)
    console.log('📋 Colunas existentes:', existingColumns.join(', '))
    
    // Colunas que devem existir de acordo com o schema
    const requiredColumns = [
      { name: 'bank_connection_id', type: 'TEXT', nullable: true },
      { name: 'bank_transaction_id', type: 'TEXT', nullable: true },
      { name: 'ai_categorized', type: 'BOOLEAN', nullable: false, default: 'false' },
    ]
    
    let created = 0
    
    for (const col of requiredColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`⚠️  Coluna ${col.name} não encontrada. Criando...`)
        
        try {
          if (col.type === 'BOOLEAN') {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "transactions" 
              ADD COLUMN "${col.name}" ${col.type} ${col.default ? `DEFAULT ${col.default}` : ''} ${col.nullable ? '' : 'NOT NULL'}
            `)
          } else {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "transactions" 
              ADD COLUMN "${col.name}" ${col.type} ${col.nullable ? '' : 'NOT NULL'}
            `)
          }
          console.log(`  ✅ Coluna ${col.name} criada.`)
          created++
        } catch (error: any) {
          console.error(`  ❌ Erro ao criar coluna ${col.name}:`, error.message)
        }
      } else {
        console.log(`  ✅ Coluna ${col.name} já existe.`)
      }
    }
    
    // Verificar se a foreign key existe
    if (created > 0 && existingColumns.includes('bank_connection_id')) {
      const fkResult = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' 
          AND constraint_name = 'transactions_bank_connection_id_fkey'
      `
      
      if (fkResult.length === 0) {
        // Verificar se a tabela bank_connections existe
        const tableExists = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'bank_connections'
        `
        
        if (tableExists.length > 0) {
          console.log('⚠️  Foreign key não encontrada. Criando...')
          try {
            await prisma.$executeRaw`
              ALTER TABLE "transactions" 
              ADD CONSTRAINT "transactions_bank_connection_id_fkey" 
              FOREIGN KEY ("bank_connection_id") 
              REFERENCES "bank_connections"("id") 
              ON DELETE SET NULL 
              ON UPDATE CASCADE
            `
            console.log('  ✅ Foreign key criada.')
          } catch (error: any) {
            console.error('  ❌ Erro ao criar foreign key:', error.message)
          }
        } else {
          console.log('  ⚠️  Tabela bank_connections não existe. Pulando criação da foreign key.')
        }
      }
    }
    
    console.log(`\n✅ Script concluído!`)
    console.log(`   📊 Colunas criadas: ${created}`)
    
  } catch (error: any) {
    console.error('❌ Erro ao corrigir tabela:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixTransactionsTable()
  .then(() => {
    console.log('✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

