/**
 * Serviço de integração com Asaas (Gateway de Pagamento)
 * Documentação: https://docs.asaas.com/
 */

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''

interface AsaasCustomer {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

interface AsaasSubscription {
  customer: string // ID do cliente no Asaas
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_CARD'
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
}

interface AsaasPayment {
  customer: string
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'DEBIT_CARD'
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
}

/**
 * Criar cliente no Asaas
 */
export async function createAsaasCustomer(data: AsaasCustomer): Promise<{ id: string }> {
  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao criar cliente no Asaas: ${error.errors?.[0]?.description || error.message || 'Erro desconhecido'}`)
  }

  return await response.json()
}

/**
 * Criar assinatura no Asaas
 */
export async function createAsaasSubscription(data: AsaasSubscription): Promise<{ id: string; status: string }> {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao criar assinatura no Asaas: ${error.errors?.[0]?.description || error.message || 'Erro desconhecido'}`)
  }

  return await response.json()
}

/**
 * Criar cobrança única no Asaas
 */
export async function createAsaasPayment(data: AsaasPayment): Promise<{ id: string; status: string; invoiceUrl?: string; bankSlipUrl?: string; pixQrCode?: string }> {
  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao criar cobrança no Asaas: ${error.errors?.[0]?.description || error.message || 'Erro desconhecido'}`)
  }

  return await response.json()
}

/**
 * Buscar assinatura no Asaas
 */
export async function getAsaasSubscription(subscriptionId: string): Promise<any> {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao buscar assinatura no Asaas: ${error.message || 'Erro desconhecido'}`)
  }

  return await response.json()
}

/**
 * Buscar pagamento no Asaas
 */
export async function getAsaasPayment(paymentId: string): Promise<any> {
  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao buscar pagamento no Asaas: ${error.message || 'Erro desconhecido'}`)
  }

  return await response.json()
}

/**
 * Cancelar assinatura no Asaas
 */
export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'access_token': ASAAS_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Erro ao cancelar assinatura no Asaas: ${error.message || 'Erro desconhecido'}`)
  }
}

