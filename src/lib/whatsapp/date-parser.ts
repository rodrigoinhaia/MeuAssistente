/**
 * Validação e Parsing de Datas em Linguagem Natural
 * Usa chrono-node para parsing avançado
 */

import * as chrono from 'chrono-node'
import { format, startOfDay, addDays, isPast, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Parse de data em linguagem natural para Date
 */
export function parseNaturalDate(text: string, referenceDate?: Date): Date | null {
  try {
    const ref = referenceDate || new Date()
    const results = chrono.pt.parse(text, ref)

    if (results.length === 0) {
      return null
    }

    const parsed = results[0].start.date()
    return parsed
  } catch (error) {
    console.error('[DATE_PARSER] Erro ao fazer parse da data:', error)
    return null
  }
}

/**
 * Extrai data e hora de uma mensagem
 */
export function extractDateTime(text: string): { date: Date; time?: string } | null {
  try {
    // Tentar parse completo (data + hora)
    const fullParse = parseNaturalDate(text)
    if (fullParse) {
      return {
        date: fullParse,
        time: format(fullParse, 'HH:mm'),
      }
    }

    // Tentar extrair apenas data
    const dateOnly = parseNaturalDate(text)
    if (dateOnly) {
      // Tentar extrair hora separadamente
      const timeRegex = /(\d{1,2})h(?:(\d{2}))?/i
      const timeMatch = text.match(timeRegex)

      if (timeMatch) {
        const hours = parseInt(timeMatch[1])
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0

        const dateWithTime = new Date(dateOnly)
        dateWithTime.setHours(hours, minutes, 0, 0)

        return {
          date: dateWithTime,
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        }
      }

      return {
        date: dateOnly,
      }
    }

    return null
  } catch (error) {
    console.error('[DATE_PARSER] Erro ao extrair data/hora:', error)
    return null
  }
}

/**
 * Formata data para exibição amigável
 */
export function formatDateForDisplay(date: Date): string {
  const now = new Date()

  if (isToday(date)) {
    return `Hoje às ${format(date, 'HH:mm')}`
  }

  if (isTomorrow(date)) {
    return `Amanhã às ${format(date, 'HH:mm')}`
  }

  // Se for no mesmo ano, mostrar apenas dia/mês
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "dd/MM 'às' HH:mm", { locale: ptBR })
  }

  // Caso contrário, mostrar data completa
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/**
 * Valida se a data não está no passado (para compromissos)
 */
export function validateFutureDate(date: Date): { valid: boolean; message?: string } {
  if (isPast(date) && !isToday(date)) {
    return {
      valid: false,
      message: 'Não é possível agendar compromissos no passado.',
    }
  }

  return { valid: true }
}

/**
 * Normaliza data para início do dia (útil para transações)
 */
export function normalizeToStartOfDay(date: Date): Date {
  return startOfDay(date)
}

/**
 * Adiciona dias a uma data
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days)
}

