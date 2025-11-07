/**
 * Utilitários gerais para formatação e conversão de dados
 */

/**
 * Converte amount (string ou number) para number
 */
export function parseAmount(amount: string | number): number {
  if (typeof amount === 'string') {
    return parseFloat(amount) || 0
  }
  return Number(amount) || 0
}

/**
 * Formata amount para exibição (R$ X,XX)
 */
export function formatAmount(amount: string | number): string {
  const num = parseAmount(amount)
  return num.toFixed(2).replace('.', ',')
}

/**
 * Converte data (string ISO ou Date) para string ISO
 */
export function formatDateToISO(date: string | Date): string {
  if (typeof date === 'string') {
    return date
  }
  return date.toISOString()
}

/**
 * Converte data para formato de input (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const iso = formatDateToISO(date)
  return iso.split('T')[0]
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDateForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

