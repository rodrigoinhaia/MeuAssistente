/**
 * Script para verificar frontend, backend e dados do app
 * Executa: npx tsx scripts/verify-app.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyApp() {
  console.log('🔍 Verificando dados do aplicativo...\n')
  
  try {
    // 1. Verificar Famílias
    console.log('📦 FAMÍLIAS:')
    const families = await prisma.family.findMany({
      include: {
        _count: {
          select: {
            users: true,
            transactions: true,
            categories: true,
          },
        },
      },
    })
    
    families.forEach(family => {
      console.log(`  ✅ ${family.name}`)
      console.log(`     - Usuários: ${family._count.users}`)
      console.log(`     - Transações: ${family._count.transactions}`)
      console.log(`     - Categorias: ${family._count.categories}`)
      console.log(`     - Status: ${family.isActive ? 'Ativa' : 'Inativa'}`)
    })
    
    // 2. Verificar Usuários
    console.log('\n👥 USUÁRIOS:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        family: {
          select: { name: true },
        },
      },
    })
    
    users.forEach(user => {
      console.log(`  ✅ ${user.name} (${user.email})`)
      console.log(`     - Role: ${user.role}`)
      console.log(`     - Família: ${user.family.name}`)
      console.log(`     - Status: ${user.isActive ? 'Ativo' : 'Inativo'}`)
    })
    
    // 3. Verificar Categorias
    console.log('\n📂 CATEGORIAS:')
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        type: true,
        color: true,
        icon: true,
        isActive: true,
        family: {
          select: { name: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    const expenseCategories = categories.filter(c => c.type === 'expense')
    const incomeCategories = categories.filter(c => c.type === 'income')
    
    console.log(`  💸 Despesas (${expenseCategories.length}):`)
    expenseCategories.forEach(cat => {
      console.log(`     - ${cat.icon || '📦'} ${cat.name} (${cat._count.transactions} transações)`)
    })
    
    console.log(`  💰 Receitas (${incomeCategories.length}):`)
    incomeCategories.forEach(cat => {
      console.log(`     - ${cat.icon || '📦'} ${cat.name} (${cat._count.transactions} transações)`)
    })
    
    // 4. Verificar Transações
    console.log('\n💰 TRANSAÇÕES:')
    const transactions = await prisma.transaction.findMany({
      include: {
        category: {
          select: { name: true, color: true, icon: true },
        },
        user: {
          select: { name: true },
        },
        family: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    })
    
    const incomeTransactions = transactions.filter(tx => tx.type === 'income')
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense')
    
    const totalIncome = incomeTransactions
      .filter(tx => tx.status === 'paid')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    const totalExpense = expenseTransactions
      .filter(tx => tx.status === 'paid')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    const pendingIncome = incomeTransactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    const pendingExpense = expenseTransactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    const overdueExpense = expenseTransactions
      .filter(tx => tx.status === 'overdue')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    
    console.log(`  📊 Total: ${transactions.length} transações`)
    console.log(`     - Receitas: ${incomeTransactions.length} (R$ ${totalIncome.toFixed(2)} pagas, R$ ${pendingIncome.toFixed(2)} pendentes)`)
    console.log(`     - Despesas: ${expenseTransactions.length} (R$ ${totalExpense.toFixed(2)} pagas, R$ ${pendingExpense.toFixed(2)} pendentes, R$ ${overdueExpense.toFixed(2)} em atraso)`)
    console.log(`     - Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`)
    
    // Últimas 5 transações
    console.log(`\n  📝 Últimas 5 transações:`)
    transactions.slice(0, 5).forEach(tx => {
      const icon = tx.category?.icon || '📦'
      const amount = Number(tx.amount).toFixed(2)
      const status = tx.status === 'paid' ? '✅' : tx.status === 'overdue' ? '⚠️' : '⏳'
      console.log(`     ${status} ${icon} ${tx.description} - R$ ${amount} (${tx.type}) - ${tx.user.name}`)
    })
    
    // 5. Verificar Planos
    console.log('\n💳 PLANOS:')
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })
    
    plans.forEach(plan => {
      console.log(`  ✅ ${plan.name} - R$ ${plan.price.toFixed(2)}/mês`)
      console.log(`     - Máx. usuários: ${plan.maxUsers}`)
      console.log(`     - Features: ${plan.features.length}`)
    })
    
    // 6. Verificar Assinaturas
    console.log('\n📋 ASSINATURAS:')
    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: {
          select: { name: true, price: true },
        },
        family: {
          select: { name: true },
        },
      },
    })
    
    if (subscriptions.length === 0) {
      console.log('  ⚠️  Nenhuma assinatura encontrada.')
    } else {
      subscriptions.forEach(sub => {
        console.log(`  ✅ ${sub.family.name} - ${sub.plan.name}`)
        console.log(`     - Status: ${sub.status}`)
        console.log(`     - Início: ${sub.startDate.toLocaleDateString('pt-BR')}`)
        if (sub.endDate) {
          console.log(`     - Fim: ${sub.endDate.toLocaleDateString('pt-BR')}`)
        }
        if (sub.asaasSubscriptionId) {
          console.log(`     - Asaas ID: ${sub.asaasSubscriptionId}`)
        }
      })
    }
    
    // 7. Verificar Integrações
    console.log('\n🔌 INTEGRAÇÕES:')
    const integrations = await prisma.integration.findMany({
      include: {
        family: {
          select: { name: true },
        },
      },
    })
    
    if (integrations.length === 0) {
      console.log('  ⚠️  Nenhuma integração encontrada.')
    } else {
      integrations.forEach(integration => {
        console.log(`  ✅ ${integration.provider.toUpperCase()} - ${integration.family.name}`)
        console.log(`     - Status: ${integration.isActive ? 'Ativa' : 'Inativa'}`)
      })
    }
    
    // Resumo
    console.log('\n📊 RESUMO GERAL:')
    console.log(`  ✅ Famílias: ${families.length}`)
    console.log(`  ✅ Usuários: ${users.length}`)
    console.log(`  ✅ Categorias: ${categories.length}`)
    console.log(`  ✅ Transações: ${transactions.length}`)
    console.log(`  ✅ Planos: ${plans.length}`)
    console.log(`  ✅ Assinaturas: ${subscriptions.length}`)
    console.log(`  ✅ Integrações: ${integrations.length}`)
    
    // Verificar problemas
    console.log('\n🔍 VERIFICAÇÕES:')
    const issues: string[] = []
    
    if (families.length === 0) {
      issues.push('⚠️  Nenhuma família encontrada')
    }
    
    if (users.length === 0) {
      issues.push('⚠️  Nenhum usuário encontrado')
    }
    
    if (categories.length === 0) {
      issues.push('⚠️  Nenhuma categoria encontrada')
    }
    
    if (transactions.length === 0) {
      issues.push('⚠️  Nenhuma transação encontrada')
    }
    
    // Verificar usuários com roles inválidos
    const invalidRoles = users.filter(u => !['SUPER_ADMIN', 'OWNER', 'USER'].includes(u.role))
    if (invalidRoles.length > 0) {
      issues.push(`⚠️  ${invalidRoles.length} usuário(s) com role inválido`)
    }
    
    if (issues.length === 0) {
      console.log('  ✅ Tudo parece estar correto!')
    } else {
      issues.forEach(issue => console.log(`  ${issue}`))
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar aplicativo:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyApp()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar verificação:', error)
    process.exit(1)
  })

