import ofxParser from 'ofx-parser'
import csv from 'csv-parser'
import { Readable } from 'stream'

export interface ParsedTransaction {
  description: string
  amount: number
  date: Date
  type: 'expense' | 'income'
  bankTransactionId?: string
}

/**
 * Parse arquivo OFX (formato padrão bancário)
 */
export async function parseOFX(fileContent: string): Promise<ParsedTransaction[]> {
  try {
    const ofxData = await ofxParser.parse(fileContent) as any
    const transactions: ParsedTransaction[] = []

    // OFX pode ter múltiplas contas
    const accounts = ofxData.OFX?.BANKMSGSRSV1?.STMTTRNRS || []
    
    for (const account of Array.isArray(accounts) ? accounts : [accounts]) {
      const statement = account.STMTRS
      if (!statement) continue

      const bankTransactions = statement.BANKTRANLIST?.STMTTRN || []
      const transactionsList = Array.isArray(bankTransactions) ? bankTransactions : [bankTransactions]

      for (const tx of transactionsList) {
        if (!tx) continue

        const amount = parseFloat(tx.TRNAMT || '0')
        const type: 'expense' | 'income' = amount < 0 ? 'expense' : 'income'
        const absAmount = Math.abs(amount)

        // Parse data (formato OFX: YYYYMMDDHHMMSS)
        const dateStr = tx.DTPOSTED || tx.DTUSER || ''
        let date = new Date()
        
        if (dateStr.length >= 8) {
          const year = parseInt(dateStr.substring(0, 4))
          const month = parseInt(dateStr.substring(4, 6)) - 1 // JS months are 0-indexed
          const day = parseInt(dateStr.substring(6, 8))
          date = new Date(year, month, day)
        }

        transactions.push({
          description: tx.MEMO || tx.NAME || 'Transação bancária',
          amount: absAmount,
          date,
          type,
          bankTransactionId: tx.FITID || undefined,
        })
      }
    }

    return transactions
  } catch (error) {
    console.error('[PARSE_OFX]', error)
    throw new Error('Erro ao processar arquivo OFX: ' + String(error))
  }
}

/**
 * Parse arquivo CSV (múltiplos formatos bancários)
 */
export async function parseCSV(fileContent: string, bankName?: string): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    const transactions: ParsedTransaction[] = []
    const stream = Readable.from([fileContent])
    
    stream
      .pipe(csv())
      .on('data', (row: any) => {
        try {
          // Tentar diferentes formatos de CSV
          const tx = parseCSVRow(row, bankName)
          if (tx) {
            transactions.push(tx)
          }
        } catch (err) {
          console.warn('[PARSE_CSV_ROW]', err, row)
        }
      })
      .on('end', () => {
        resolve(transactions)
      })
      .on('error', (error) => {
        reject(new Error('Erro ao processar CSV: ' + String(error)))
      })
  })
}

/**
 * Parse uma linha de CSV baseado no formato do banco
 */
function parseCSVRow(row: any, bankName?: string): ParsedTransaction | null {
  // Normalizar nomes de colunas (case insensitive)
  const normalizedRow: any = {}
  for (const key in row) {
    normalizedRow[key.toLowerCase().trim()] = row[key]
  }

  let description = ''
  let amount = 0
  let date = new Date()
  let bankTransactionId: string | undefined

  // Formato Nubank
  if (normalizedRow['data'] && normalizedRow['descrição']) {
    description = normalizedRow['descrição'] || normalizedRow['descricao'] || ''
    amount = parseFloat((normalizedRow['valor'] || '0').toString().replace(',', '.'))
    date = parseDate(normalizedRow['data'])
    bankTransactionId = normalizedRow['id'] || undefined
  }
  // Formato Banco do Brasil
  else if (normalizedRow['data lançamento'] || normalizedRow['data_lancamento']) {
    description = normalizedRow['histórico'] || normalizedRow['historico'] || normalizedRow['descrição'] || ''
    amount = parseFloat((normalizedRow['valor'] || '0').toString().replace(',', '.'))
    date = parseDate(normalizedRow['data lançamento'] || normalizedRow['data_lancamento'])
  }
  // Formato Itaú
  else if (normalizedRow['data movimento'] || normalizedRow['data_movimento']) {
    description = normalizedRow['histórico'] || normalizedRow['historico'] || normalizedRow['descrição'] || ''
    amount = parseFloat((normalizedRow['valor'] || '0').toString().replace(',', '.'))
    date = parseDate(normalizedRow['data movimento'] || normalizedRow['data_movimento'])
  }
  // Formato Bradesco
  else if (normalizedRow['data'] && normalizedRow['histórico']) {
    description = normalizedRow['histórico'] || normalizedRow['historico'] || ''
    amount = parseFloat((normalizedRow['valor'] || '0').toString().replace(',', '.'))
    date = parseDate(normalizedRow['data'])
  }
  // Formato genérico (tentar colunas comuns)
  else {
    description = normalizedRow['descrição'] || normalizedRow['descricao'] || normalizedRow['desc'] || normalizedRow['histórico'] || normalizedRow['historico'] || normalizedRow['memo'] || ''
    const amountStr = normalizedRow['valor'] || normalizedRow['value'] || normalizedRow['amount'] || normalizedRow['total'] || '0'
    amount = parseFloat(amountStr.toString().replace(',', '.'))
    
    const dateStr = normalizedRow['data'] || normalizedRow['date'] || normalizedRow['data movimento'] || normalizedRow['data_lancamento'] || ''
    if (dateStr) {
      date = parseDate(dateStr)
    }
  }

  if (!description || amount === 0) {
    return null // Linha inválida
  }

  const type: 'expense' | 'income' = amount < 0 ? 'expense' : 'income'
  const absAmount = Math.abs(amount)

  return {
    description: description.trim(),
    amount: absAmount,
    date,
    type,
    bankTransactionId,
  }
}

/**
 * Parse data em vários formatos
 */
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date()

  // Formato DD/MM/YYYY
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match1 = dateStr.match(ddmmyyyy)
  if (match1) {
    return new Date(parseInt(match1[3]), parseInt(match1[2]) - 1, parseInt(match1[1]))
  }

  // Formato YYYY-MM-DD
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/
  const match2 = dateStr.match(yyyymmdd)
  if (match2) {
    return new Date(parseInt(match2[1]), parseInt(match2[2]) - 1, parseInt(match2[3]))
  }

  // Formato DD-MM-YYYY
  const ddmmyyyy2 = /^(\d{2})-(\d{2})-(\d{4})$/
  const match3 = dateStr.match(ddmmyyyy2)
  if (match3) {
    return new Date(parseInt(match3[3]), parseInt(match3[2]) - 1, parseInt(match3[1]))
  }

  // Tentar parse direto
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  return new Date()
}

/**
 * Detectar tipo de arquivo pelo conteúdo
 */
export function detectFileType(fileName: string, content: string): 'ofx' | 'csv' | 'unknown' {
  const extension = fileName.toLowerCase().split('.').pop()
  
  if (extension === 'ofx') return 'ofx'
  if (extension === 'csv') return 'csv'
  
  // Tentar detectar pelo conteúdo
  if (content.includes('<OFX>') || content.includes('<?OFX')) {
    return 'ofx'
  }
  
  if (content.includes(',') && content.includes('\n')) {
    return 'csv'
  }
  
  return 'unknown'
}

