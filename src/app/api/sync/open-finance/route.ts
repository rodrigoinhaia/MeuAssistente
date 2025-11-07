import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'

// Sincronizar transações do Open Finance
export async function POST(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    const { connectionId, startDate, endDate } = await req.json()
    
    if (!connectionId) {
      return NextResponse.json(
        { status: 'error', message: 'ID da conexão é obrigatório.' },
        { status: 400 }
      )
    }

    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        familyId,
        userId,
        status: 'active',
      },
    })

    if (!connection) {
      return NextResponse.json(
        { status: 'error', message: 'Conexão bancária não encontrada ou inativa.' },
        { status: 404 }
      )
    }

    // Em produção, aqui você buscaria as transações do provedor Open Finance
    // Por enquanto, simulando a estrutura
    // Exemplo com Plugg.to ou similar:
    /*
    const transactions = await fetch(`${providerApiUrl}/transactions`, {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
      },
      params: {
        accountId: connection.accountId,
        startDate,
        endDate,
      },
    })
    */

    // Simulação de transações (em produção viria da API do provedor)
    const mockTransactions: any[] = [] // Seria preenchido com dados reais

    const results = []
    let imported = 0
    let errors = 0

    for (const bankTx of mockTransactions) {
      try {
        // Verificar se já existe
        const existing = await prisma.transaction.findUnique({
          where: {
            bankConnectionId_bankTransactionId: {
              bankConnectionId: connectionId,
              bankTransactionId: bankTx.id,
            },
          },
        })

        if (existing) {
          continue // Já importada
        }

        // Determinar tipo (expense ou income)
        const amount = parseFloat(bankTx.amount || '0')
        const type = amount >= 0 ? 'income' : 'expense'
        const absAmount = Math.abs(amount)

        // Criar transação (sem categoria inicialmente - será categorizada por IA)
        const transaction = await prisma.transaction.create({
          data: {
            familyId,
            userId,
            bankConnectionId: connectionId,
            bankTransactionId: bankTx.id,
            amount: absAmount,
            description: bankTx.description || bankTx.merchantName || 'Transação bancária',
            type,
            date: new Date(bankTx.date || bankTx.postedDate),
            status: 'paid', // Transações bancárias geralmente já estão pagas
            aiCategorized: false, // Será categorizado por IA depois
          },
        })

        imported++
        results.push({
          bankTransactionId: bankTx.id,
          transactionId: transaction.id,
          status: 'imported',
        })

        // Enviar para N8N para categorização por IA (se N8N estiver configurado)
        // Isso pode ser feito via webhook ou fila
      } catch (err: any) {
        errors++
        results.push({
          bankTransactionId: bankTx.id,
          status: 'error',
          error: err.message,
        })
      }
    }

    // Atualizar última sincronização
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      status: 'ok',
      message: `Sincronização concluída: ${imported} transações importadas, ${errors} erros`,
      results,
      imported,
      errors,
    })
  } catch (error) {
    console.error('[OPEN_FINANCE_SYNC]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao sincronizar transações', error: String(error) },
      { status: 500 }
    )
  }
}

// Categorizar transações não categorizadas com IA (via N8N)
export async function PATCH(req: Request) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id
  
  try {
    // Buscar transações não categorizadas
    const uncategorized = await prisma.transaction.findMany({
      where: {
        familyId,
        categoryId: null,
        aiCategorized: false,
      },
      take: 50, // Processar em lotes
    })

    if (uncategorized.length === 0) {
      return NextResponse.json({
        status: 'ok',
        message: 'Nenhuma transação pendente de categorização',
        categorized: 0,
      })
    }

    // Buscar categorias disponíveis
    const categories = await prisma.category.findMany({
      where: { familyId, isActive: true },
    })

    let categorized = 0
    const results = []

    for (const transaction of uncategorized) {
      try {
        // Em produção, aqui você enviaria para N8N que processaria com IA
        // Por enquanto, usando lógica simples de matching por palavras-chave
        
        // Exemplo: buscar categoria mais provável baseado na descrição
        const description = transaction.description.toLowerCase()
        let matchedCategory = null

        for (const category of categories) {
          const categoryName = category.name.toLowerCase()
          if (description.includes(categoryName) || categoryName.includes(description)) {
            matchedCategory = category
            break
          }
        }

        // Se não encontrou, usar categoria padrão baseada em palavras-chave comuns
        if (!matchedCategory) {
          if (description.includes('supermercado') || description.includes('mercado') || description.includes('padaria')) {
            matchedCategory = categories.find(c => c.name.toLowerCase().includes('alimentação') || c.name.toLowerCase().includes('compras'))
          } else if (description.includes('combustível') || description.includes('posto')) {
            matchedCategory = categories.find(c => c.name.toLowerCase().includes('transporte') || c.name.toLowerCase().includes('combustível'))
          } else if (description.includes('farmacia') || description.includes('farmácia')) {
            matchedCategory = categories.find(c => c.name.toLowerCase().includes('saúde') || c.name.toLowerCase().includes('farmácia'))
          }
        }

        if (matchedCategory) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              categoryId: matchedCategory.id,
              aiCategorized: true,
            },
          })
          categorized++
          results.push({
            transactionId: transaction.id,
            categoryId: matchedCategory.id,
            categoryName: matchedCategory.name,
            status: 'categorized',
          })
        } else {
          results.push({
            transactionId: transaction.id,
            status: 'no_match',
            message: 'Nenhuma categoria encontrada',
          })
        }
      } catch (err: any) {
        results.push({
          transactionId: transaction.id,
          status: 'error',
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: `${categorized} transações categorizadas`,
      categorized,
      results,
    })
  } catch (error) {
    console.error('[OPEN_FINANCE_CATEGORIZE]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao categorizar transações', error: String(error) },
      { status: 500 }
    )
  }
}

