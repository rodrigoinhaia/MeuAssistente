import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/authorization'
import { parseOFX, parseCSV, detectFileType, ParsedTransaction } from '@/lib/file-parsers'

export async function POST(req: NextRequest) {
  const { session, role, familyId, error } = await requireAuth(req, [])
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: error.status })
  }
  const userId = (session.user as any)?.id

  // SUPER_ADMIN em modo admin NÃO pode importar transações
  const contextHeader = req.headers.get('x-admin-context')
  const adminContext = (contextHeader === 'admin' || contextHeader === 'family') ? contextHeader : 'family'
  
  if (role === 'SUPER_ADMIN' && adminContext === 'admin') {
    return NextResponse.json(
      { status: 'error', message: 'Acesso negado. Transações são dados familiares.' },
      { status: 403 }
    )
  }

  if (!familyId) {
    return NextResponse.json({ status: 'error', message: 'FamilyId é obrigatório' }, { status: 400 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bankName = formData.get('bankName') as string | null

    if (!file) {
      return NextResponse.json(
        { status: 'error', message: 'Arquivo é obrigatório.' },
        { status: 400 }
      )
    }

    // Ler conteúdo do arquivo
    const fileContent = await file.text()
    const fileName = file.name

    // Detectar tipo de arquivo
    const fileType = detectFileType(fileName, fileContent)

    if (fileType === 'unknown') {
      return NextResponse.json(
        { status: 'error', message: 'Formato de arquivo não suportado. Use OFX ou CSV.' },
        { status: 400 }
      )
    }

    // Parse do arquivo
    let parsedTransactions: ParsedTransaction[] = []

    if (fileType === 'ofx') {
      parsedTransactions = await parseOFX(fileContent)
    } else if (fileType === 'csv') {
      parsedTransactions = await parseCSV(fileContent, bankName || undefined)
    }

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Nenhuma transação encontrada no arquivo.' },
        { status: 400 }
      )
    }

    // Buscar categorias disponíveis para categorização automática
    const categories = await prisma.category.findMany({
      where: { familyId, isActive: true },
    })

    // Importar transações
    const results = []
    let imported = 0
    let duplicates = 0
    let errors = 0
    let categorized = 0

    for (const parsedTx of parsedTransactions) {
      try {
        // Verificar se já existe (por bankTransactionId ou por descrição + data + valor)
        const existing = parsedTx.bankTransactionId
          ? await prisma.transaction.findFirst({
              where: {
                familyId,
                bankTransactionId: parsedTx.bankTransactionId,
              },
            })
          : await prisma.transaction.findFirst({
              where: {
                familyId,
                description: parsedTx.description,
                amount: parsedTx.amount,
                date: parsedTx.date,
              },
            })

        if (existing) {
          duplicates++
          results.push({
            description: parsedTx.description,
            status: 'duplicate',
            message: 'Transação já existe',
          })
          continue
        }

        // Tentar categorizar automaticamente
        let categoryId: string | null = null
        const description = parsedTx.description.toLowerCase()
        
        for (const category of categories) {
          const categoryName = category.name.toLowerCase()
          if (
            description.includes(categoryName) ||
            categoryName.includes(description) ||
            matchKeywords(description, category.name)
          ) {
            categoryId = category.id
            categorized++
            break
          }
        }

        // Se não encontrou, tentar palavras-chave comuns
        if (!categoryId) {
          categoryId = matchCommonKeywords(description, categories)
          if (categoryId) categorized++
        }

        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            familyId,
            userId,
            description: parsedTx.description,
            amount: parsedTx.amount,
            date: parsedTx.date,
            type: parsedTx.type,
            status: 'paid', // Transações bancárias geralmente já estão pagas
            categoryId,
            bankTransactionId: parsedTx.bankTransactionId || undefined,
            aiCategorized: !!categoryId, // Se foi categorizada automaticamente
          },
          include: {
            category: { select: { name: true, color: true } },
          },
        })

        imported++
        results.push({
          description: parsedTx.description,
          amount: parsedTx.amount,
          date: parsedTx.date,
          status: 'imported',
          transactionId: transaction.id,
          categoryId: transaction.categoryId,
          categoryName: transaction.category?.name,
        })
      } catch (err: any) {
        errors++
        results.push({
          description: parsedTx.description,
          status: 'error',
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: `Importação concluída: ${imported} importadas, ${duplicates} duplicadas, ${errors} erros, ${categorized} categorizadas`,
      summary: {
        imported,
        duplicates,
        errors,
        categorized,
        total: parsedTransactions.length,
      },
      results,
    })
  } catch (error) {
    console.error('[IMPORT_TRANSACTIONS]', error)
    return NextResponse.json(
      { status: 'error', message: 'Erro ao importar transações', error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Match por palavras-chave simples
 */
function matchKeywords(description: string, categoryName: string): boolean {
  const keywords: { [key: string]: string[] } = {
    'alimentação': ['supermercado', 'mercado', 'padaria', 'restaurante', 'lanche', 'comida', 'ifood', 'uber eats'],
    'transporte': ['combustível', 'posto', 'gasolina', 'uber', 'taxi', 'ônibus', 'metro', 'estacionamento'],
    'saúde': ['farmácia', 'farmacia', 'médico', 'hospital', 'clínica', 'exame'],
    'educação': ['escola', 'curso', 'livro', 'material escolar', 'mensalidade'],
    'lazer': ['cinema', 'show', 'viagem', 'hotel', 'passeio'],
    'contas': ['luz', 'água', 'agua', 'internet', 'telefone', 'gás', 'gas'],
  }

  const categoryLower = categoryName.toLowerCase()
  for (const [key, words] of Object.entries(keywords)) {
    if (categoryLower.includes(key)) {
      return words.some(word => description.includes(word))
    }
  }

  return false
}

/**
 * Match por palavras-chave comuns
 */
function matchCommonKeywords(description: string, categories: any[]): string | null {
  const commonMatches: { [key: string]: string[] } = {
    'supermercado': ['alimentação', 'compras'],
    'mercado': ['alimentação', 'compras'],
    'padaria': ['alimentação'],
    'restaurante': ['alimentação'],
    'ifood': ['alimentação'],
    'uber eats': ['alimentação'],
    'combustível': ['transporte'],
    'posto': ['transporte'],
    'gasolina': ['transporte'],
    'uber': ['transporte'],
    'taxi': ['transporte'],
    'farmácia': ['saúde'],
    'farmacia': ['saúde'],
    'médico': ['saúde'],
    'hospital': ['saúde'],
    'luz': ['contas', 'utilidades'],
    'água': ['contas', 'utilidades'],
    'agua': ['contas', 'utilidades'],
    'internet': ['contas', 'utilidades'],
    'telefone': ['contas', 'utilidades'],
  }

  for (const [keyword, categoryNames] of Object.entries(commonMatches)) {
    if (description.includes(keyword)) {
      for (const catName of categoryNames) {
        const category = categories.find(c => c.name.toLowerCase().includes(catName))
        if (category) {
          return category.id
        }
      }
    }
  }

  return null
}

