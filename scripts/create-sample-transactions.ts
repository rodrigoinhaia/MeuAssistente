/**
 * Script para criar transações de exemplo
 * Executa: npx tsx scripts/create-sample-transactions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSampleTransactions() {
  console.log('🔍 Buscando família e usuários...')
  
  try {
    // Buscar a família do OWNER (Família Silva)
    const family = await prisma.family.findFirst({
      where: { name: 'Família Silva' },
      include: { users: true },
    })
    
    if (!family) {
      console.log('⚠️  Família "Família Silva" não encontrada.')
      return
    }
    
    const owner = family.users.find(u => u.role === 'OWNER')
    if (!owner) {
      console.log('⚠️  Usuário OWNER não encontrado.')
      return
    }
    
    // Buscar categorias
    const categories = await prisma.category.findMany({
      where: { familyId: family.id },
    })
    
    if (categories.length === 0) {
      console.log('⚠️  Nenhuma categoria encontrada. Execute o script de categorias primeiro.')
      return
    }
    
    const expenseCategories = categories.filter(c => c.type === 'expense')
    const incomeCategories = categories.filter(c => c.type === 'income')
    
    console.log(`✅ Família encontrada: ${family.name}`)
    console.log(`✅ Usuário OWNER: ${owner.name}`)
    console.log(`✅ Categorias: ${categories.length} (${expenseCategories.length} despesas, ${incomeCategories.length} receitas)`)
    
    // Criar transações de exemplo
    const today = new Date()
    const transactions = []
    
    // Receitas do mês atual
    const salaryCategory = incomeCategories.find(c => c.name === 'Salário') || incomeCategories[0]
    transactions.push({
      description: 'Salário Mensal',
      amount: 5000.00,
      type: 'income',
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      status: 'paid',
      categoryId: salaryCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const freelanceCategory = incomeCategories.find(c => c.name === 'Freelance') || incomeCategories[0]
    transactions.push({
      description: 'Projeto Freelance - Desenvolvimento Web',
      amount: 1500.00,
      type: 'income',
      date: new Date(today.getFullYear(), today.getMonth(), 15),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 20),
      status: 'paid',
      categoryId: freelanceCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    // Despesas do mês atual
    const alimentacaoCategory = expenseCategories.find(c => c.name === 'Alimentação') || expenseCategories[0]
    transactions.push({
      description: 'Supermercado - Compras do mês',
      amount: 450.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 3),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 10),
      status: 'paid',
      categoryId: alimentacaoCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    transactions.push({
      description: 'Restaurante - Jantar em família',
      amount: 120.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 8),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 8),
      status: 'paid',
      categoryId: alimentacaoCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const transporteCategory = expenseCategories.find(c => c.name === 'Transporte') || expenseCategories[0]
    transactions.push({
      description: 'Combustível - Posto Shell',
      amount: 250.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      status: 'paid',
      categoryId: transporteCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    transactions.push({
      description: 'Uber - Viagens do mês',
      amount: 180.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 12),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 12),
      status: 'paid',
      categoryId: transporteCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const moradiaCategory = expenseCategories.find(c => c.name === 'Moradia') || expenseCategories[0]
    transactions.push({
      description: 'Aluguel - Apartamento',
      amount: 1200.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      status: 'paid',
      categoryId: moradiaCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    transactions.push({
      description: 'Condomínio',
      amount: 350.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 10),
      status: 'paid',
      categoryId: moradiaCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const contasCategory = expenseCategories.find(c => c.name === 'Contas') || expenseCategories[0]
    transactions.push({
      description: 'Energia Elétrica',
      amount: 150.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 15),
      status: 'paid',
      categoryId: contasCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    transactions.push({
      description: 'Internet + TV',
      amount: 120.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 10),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 15),
      status: 'paid',
      categoryId: contasCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const saudeCategory = expenseCategories.find(c => c.name === 'Saúde') || expenseCategories[0]
    transactions.push({
      description: 'Consulta Médica',
      amount: 200.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 7),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 7),
      status: 'paid',
      categoryId: saudeCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const educacaoCategory = expenseCategories.find(c => c.name === 'Educação') || expenseCategories[0]
    transactions.push({
      description: 'Mensalidade - Curso Online',
      amount: 299.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      status: 'paid',
      categoryId: educacaoCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    const lazerCategory = expenseCategories.find(c => c.name === 'Lazer') || expenseCategories[0]
    transactions.push({
      description: 'Cinema - Ingressos',
      amount: 60.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 14),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 14),
      status: 'paid',
      categoryId: lazerCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    // Transações pendentes (para o futuro)
    transactions.push({
      description: 'Conta de Água',
      amount: 80.00,
      type: 'expense',
      date: new Date(today.getFullYear(), today.getMonth(), 20),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 25),
      status: 'pending',
      categoryId: contasCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    transactions.push({
      description: 'Freelance - Design Gráfico',
      amount: 800.00,
      type: 'income',
      date: new Date(today.getFullYear(), today.getMonth(), 25),
      dueDate: new Date(today.getFullYear(), today.getMonth(), 30),
      status: 'pending',
      categoryId: freelanceCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    // Transações em atraso (do mês passado)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    transactions.push({
      description: 'Conta de Telefone (Atrasada)',
      amount: 95.00,
      type: 'expense',
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 28),
      dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10),
      status: 'overdue',
      categoryId: contasCategory.id,
      familyId: family.id,
      userId: owner.id,
    })
    
    console.log(`\n📝 Criando ${transactions.length} transações de exemplo...`)
    
    let created = 0
    let skipped = 0
    
    for (const tx of transactions) {
      try {
        // Verificar se já existe (por descrição e data)
        const exists = await prisma.transaction.findFirst({
          where: {
            familyId: tx.familyId,
            description: tx.description,
            date: tx.date,
          },
        })
        
        if (exists) {
          console.log(`  ⏭️  Transação "${tx.description}" já existe`)
          skipped++
        } else {
          await prisma.transaction.create({ data: tx })
          console.log(`  ✅ Criada: ${tx.description} - R$ ${tx.amount.toFixed(2)} (${tx.type})`)
          created++
        }
      } catch (error: any) {
        console.error(`  ❌ Erro ao criar "${tx.description}":`, error.message)
      }
    }
    
    console.log(`\n✅ Script concluído!`)
    console.log(`   📊 Transações criadas: ${created}`)
    console.log(`   ⏭️  Transações já existentes: ${skipped}`)
    
    // Estatísticas
    const totalIncome = transactions
      .filter(tx => tx.type === 'income' && tx.status === 'paid')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const totalExpense = transactions
      .filter(tx => tx.type === 'expense' && tx.status === 'paid')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    console.log(`\n📊 Estatísticas:`)
    console.log(`   💰 Receitas pagas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`   💸 Despesas pagas: R$ ${totalExpense.toFixed(2)}`)
    console.log(`   💵 Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`)
    
  } catch (error: any) {
    console.error('❌ Erro ao criar transações:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createSampleTransactions()
  .then(() => {
    console.log('✅ Processo concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

