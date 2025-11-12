/**
 * Script para criar categorias padrão para todas as famílias
 * Executa: npx tsx scripts/create-default-categories.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Categorias padrão de despesas
const defaultExpenseCategories = [
  { name: 'Alimentação', color: '#EF4444', icon: '🍔' },
  { name: 'Transporte', color: '#3B82F6', icon: '🚗' },
  { name: 'Moradia', color: '#8B5CF6', icon: '🏠' },
  { name: 'Saúde', color: '#10B981', icon: '🏥' },
  { name: 'Educação', color: '#F59E0B', icon: '📚' },
  { name: 'Lazer', color: '#EC4899', icon: '🎬' },
  { name: 'Roupas', color: '#6366F1', icon: '👕' },
  { name: 'Contas', color: '#14B8A6', icon: '💡' },
  { name: 'Compras', color: '#F97316', icon: '🛒' },
  { name: 'Outros', color: '#6B7280', icon: '📦' },
]

// Categorias padrão de receitas
const defaultIncomeCategories = [
  { name: 'Salário', color: '#10B981', icon: '💰' },
  { name: 'Freelance', color: '#3B82F6', icon: '💼' },
  { name: 'Investimentos', color: '#8B5CF6', icon: '📈' },
  { name: 'Vendas', color: '#F59E0B', icon: '🛍️' },
  { name: 'Presentes', color: '#EC4899', icon: '🎁' },
  { name: 'Outros', color: '#6B7280', icon: '📦' },
]

async function createDefaultCategories() {
  console.log('🔍 Buscando famílias...')
  
  try {
    // Buscar todas as famílias ativas
    const families = await prisma.family.findMany({
      where: { isActive: true },
    })
    
    if (families.length === 0) {
      console.log('⚠️  Nenhuma família encontrada. Execute o seed primeiro.')
      return
    }
    
    console.log(`✅ Encontradas ${families.length} família(s)`)
    
    let totalCreated = 0
    let totalSkipped = 0
    
    for (const family of families) {
      console.log(`\n📦 Processando família: ${family.name} (${family.id})`)
      
      // Criar categorias de despesas
      for (const category of defaultExpenseCategories) {
        try {
          const existing = await prisma.category.findFirst({
            where: {
              familyId: family.id,
              name: category.name,
              type: 'expense',
            },
          })
          
          if (existing) {
            console.log(`  ⏭️  Categoria "${category.name}" (despesa) já existe`)
            totalSkipped++
          } else {
            await prisma.category.create({
              data: {
                familyId: family.id,
                name: category.name,
                type: 'expense',
                color: category.color,
                icon: category.icon,
                isActive: true,
              },
            })
            console.log(`  ✅ Criada categoria "${category.name}" (despesa)`)
            totalCreated++
          }
        } catch (error: any) {
          console.error(`  ❌ Erro ao criar categoria "${category.name}":`, error.message)
        }
      }
      
      // Criar categorias de receitas
      for (const category of defaultIncomeCategories) {
        try {
          const existing = await prisma.category.findFirst({
            where: {
              familyId: family.id,
              name: category.name,
              type: 'income',
            },
          })
          
          if (existing) {
            console.log(`  ⏭️  Categoria "${category.name}" (receita) já existe`)
            totalSkipped++
          } else {
            await prisma.category.create({
              data: {
                familyId: family.id,
                name: category.name,
                type: 'income',
                color: category.color,
                icon: category.icon,
                isActive: true,
              },
            })
            console.log(`  ✅ Criada categoria "${category.name}" (receita)`)
            totalCreated++
          }
        } catch (error: any) {
          console.error(`  ❌ Erro ao criar categoria "${category.name}":`, error.message)
        }
      }
    }
    
    console.log(`\n✅ Script concluído!`)
    console.log(`   📊 Categorias criadas: ${totalCreated}`)
    console.log(`   ⏭️  Categorias já existentes: ${totalSkipped}`)
    
  } catch (error: any) {
    console.error('❌ Erro ao criar categorias:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultCategories()
  .then(() => {
    console.log('✅ Processo concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

