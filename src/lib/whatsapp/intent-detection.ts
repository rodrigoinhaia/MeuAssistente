/**
 * Detecção de Intents (Intenções) em Mensagens
 * Usa Regex como fallback e pode ser expandido com LLM
 */

export type IntentType =
  | 'expense'
  | 'income'
  | 'appointment'
  | 'report'
  | 'confirmation'
  | 'cancel'
  | 'edit'
  | 'other'

export interface IntentResult {
  type: IntentType
  confidence: number
  extractedData?: {
    amount?: number
    category?: string
    description?: string
    date?: Date
    time?: string
    title?: string
  }
}

/**
 * Padrões Regex para detecção rápida
 */
const patterns = {
  expense: [
    /gast(ei|ou|ar|ando)/i,
    /paguei|pague|pagar/i,
    /comprei|comprar|compra/i,
    /despesa/i,
    /sa[ií]da/i,
    /retirei|retirar/i,
    /paguei\s+(?:R\$?\s*)?([\d.,]+)/i,
    /gast(ei|ou)\s+(?:R\$?\s*)?([\d.,]+)/i,
    /comprei.*(?:R\$?\s*)?([\d.,]+)/i,
  ],
  income: [
    /ganh(ei|ou|ar|ando)/i,
    /recebi|receber|receita/i,
    /entrou|entrar/i,
    /depositei|depositar/i,
    /sal[aá]rio/i,
    /ganh(ei|ou)\s+(?:R\$?\s*)?([\d.,]+)/i,
    /recebi\s+(?:R\$?\s*)?([\d.,]+)/i,
    /entrou\s+(?:R\$?\s*)?([\d.,]+)/i,
  ],
  appointment: [
    /agend(ar|e|ei|ou|ando)/i,
    /marcar|marcar|marcado/i,
    /lembrar|lembre|lembre-me/i,
    /compromisso/i,
    /reuni[aã]o/i,
    /consulta/i,
    /agend(ar|e).*(\d{1,2}[\/\-]\d{1,2})/i,
    /marcar.*(\d{1,2}[\/\-]\d{1,2}).*(\d{1,2}h?)/i,
  ],
  report: [
    /gastos?/i,
    /relat[óo]rio/i,
    /quanto.*gast(ei|ou|ar)/i,
    /quanto.*m[êe]s/i,
    /saldo/i,
    /resumo/i,
    /extrato/i,
    /balan[çc]o/i,
  ],
  confirmation: [
    /confirmar|confirma|sim|ok|correto|est[aá] certo/i,
    /^sim$/i,
    /^ok$/i,
    /^confirmar$/i,
  ],
  cancel: [
    /cancelar|cancela|n[aã]o|nope/i,
    /^n[aã]o$/i,
    /^cancelar$/i,
  ],
  edit: [
    /editar|edita|alterar|mudar|corrigir/i,
    /^editar$/i,
    /^alterar$/i,
  ],
}

/**
 * Extrai valor monetário da mensagem
 */
function extractAmount(text: string): number | null {
  const amountRegex = /(?:R\$?\s*)?([\d.,]+)/g
  const matches = text.match(amountRegex)
  if (!matches || matches.length === 0) return null

  // Pegar o maior valor encontrado (geralmente é o valor principal)
  const amounts = matches.map((match) => {
    const cleaned = match.replace(/R\$?\s*/g, '').replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned)
  })

  return Math.max(...amounts.filter((a) => !isNaN(a)))
}

/**
 * Extrai categoria da mensagem
 */
function extractCategory(text: string): string | undefined {
  const categoryKeywords: Record<string, string[]> = {
    alimentação: ['restaurante', 'lanche', 'comida', 'almoço', 'jantar', 'mercado', 'supermercado'],
    transporte: ['uber', 'taxi', 'ônibus', 'gasolina', 'combustível', 'estacionamento'],
    saúde: ['médico', 'farmácia', 'remédio', 'consulta', 'exame'],
    educação: ['curso', 'livro', 'escola', 'faculdade', 'material'],
    lazer: ['cinema', 'show', 'festival', 'viagem', 'passeio'],
    moradia: ['aluguel', 'condomínio', 'luz', 'água', 'internet', 'telefone'],
    outros: [],
  }

  const lowerText = text.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return category
    }
  }

  return undefined
}

/**
 * Extrai descrição da mensagem
 */
function extractDescription(text: string): string | undefined {
  // Remove padrões de valor e datas
  const cleaned = text
    .replace(/(?:R\$?\s*)?[\d.,]+/g, '')
    .replace(/\d{1,2}[\/\-]\d{1,2}/g, '')
    .replace(/\d{1,2}h/g, '')
    .trim()

  // Remove palavras de comando
  const commandWords = [
    'gastei',
    'paguei',
    'comprei',
    'ganhei',
    'recebi',
    'agendar',
    'marcar',
    'lembrar',
  ]

  const words = cleaned.split(/\s+/).filter((word) => {
    const lower = word.toLowerCase()
    return !commandWords.some((cmd) => lower.includes(cmd))
  })

  return words.length > 0 ? words.join(' ').trim() : undefined
}

/**
 * Detecta intent usando Regex (método rápido)
 */
export function detectIntentRegex(message: string): IntentResult {
  const lowerMessage = message.toLowerCase().trim()

  // Verificar confirmação/cancelamento primeiro (alta prioridade)
  for (const pattern of patterns.confirmation) {
    if (pattern.test(lowerMessage)) {
      return {
        type: 'confirmation',
        confidence: 0.9,
      }
    }
  }

  for (const pattern of patterns.cancel) {
    if (pattern.test(lowerMessage)) {
      return {
        type: 'cancel',
        confidence: 0.9,
      }
    }
  }

  for (const pattern of patterns.edit) {
    if (pattern.test(lowerMessage)) {
      return {
        type: 'edit',
        confidence: 0.8,
      }
    }
  }

  // Verificar outros intents
  let bestMatch: IntentResult | null = null
  let bestConfidence = 0

  // Expense
  for (const pattern of patterns.expense) {
    if (pattern.test(message)) {
      const confidence = message.match(pattern) ? 0.85 : 0.7
      if (confidence > bestConfidence) {
        const amount = extractAmount(message)
        const category = extractCategory(message)
        const description = extractDescription(message)

        bestMatch = {
          type: 'expense',
          confidence,
          extractedData: {
            amount: amount || undefined,
            category,
            description,
          },
        }
        bestConfidence = confidence
      }
    }
  }

  // Income
  for (const pattern of patterns.income) {
    if (pattern.test(message)) {
      const confidence = message.match(pattern) ? 0.85 : 0.7
      if (confidence > bestConfidence) {
        const amount = extractAmount(message)
        const description = extractDescription(message)

        bestMatch = {
          type: 'income',
          confidence,
          extractedData: {
            amount: amount || undefined,
            description,
          },
        }
        bestConfidence = confidence
      }
    }
  }

  // Appointment
  for (const pattern of patterns.appointment) {
    if (pattern.test(message)) {
      const confidence = message.match(pattern) ? 0.8 : 0.65
      if (confidence > bestConfidence) {
        const description = extractDescription(message)

        bestMatch = {
          type: 'appointment',
          confidence,
          extractedData: {
            description,
            title: description,
          },
        }
        bestConfidence = confidence
      }
    }
  }

  // Report
  for (const pattern of patterns.report) {
    if (pattern.test(message)) {
      const confidence = 0.75
      if (confidence > bestConfidence) {
        bestMatch = {
          type: 'report',
          confidence,
        }
        bestConfidence = confidence
      }
    }
  }

  return bestMatch || {
    type: 'other',
    confidence: 0.5,
  }
}

/**
 * Detecta intent usando LLM (opcional, para melhor precisão)
 * Por enquanto retorna null, mas pode ser implementado com OpenAI/Claude
 */
export async function detectIntentLLM(
  message: string
): Promise<IntentResult | null> {
  // TODO: Implementar com OpenAI/Claude quando necessário
  // const prompt = `Classifique em: expense, income, appointment, report, other. Apenas uma palavra. Mensagem: "${message}"`
  return null
}

/**
 * Detecta intent (combina Regex + LLM se disponível)
 */
export async function detectIntent(message: string): Promise<IntentResult> {
  // Priorizar regex (rápido e eficiente)
  const regexResult = detectIntentRegex(message)

  // Se confiança alta, retornar direto
  if (regexResult.confidence >= 0.8) {
    return regexResult
  }

  // Se confiança baixa, tentar LLM (se disponível)
  const llmResult = await detectIntentLLM(message)
  if (llmResult && llmResult.confidence > regexResult.confidence) {
    return llmResult
  }

  return regexResult
}

