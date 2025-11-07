"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Payment {
  id: string
  familyId: string
  familyName: string
  subscriptionId: string
  amount: number
  status: PaymentStatus
  dueDate: string
  paidDate?: string
  invoiceNumber: string
}

enum PaymentStatus {
  pending = "pending",
  paid = "paid",
  overdue = "overdue",
  cancelled = "cancelled",
  failed = "failed",
}

const statusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.pending]: 'Pendente',
  [PaymentStatus.paid]: 'Pago',
  [PaymentStatus.overdue]: 'Vencido',
  [PaymentStatus.cancelled]: 'Cancelado',
  [PaymentStatus.failed]: 'Falhou',
}

const statusColors: Record<PaymentStatus, { bg: string; text: string }> = {
  [PaymentStatus.pending]: {
    bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
    text: 'text-yellow-400',
  },
  [PaymentStatus.paid]: {
    bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
    text: 'text-emerald-400',
  },
  [PaymentStatus.overdue]: {
    bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
    text: 'text-red-400',
  },
  [PaymentStatus.cancelled]: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
  },
  [PaymentStatus.failed]: {
    bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
    text: 'text-red-400',
  },
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar pagamentos')
      }

      const formattedPayments: Payment[] = data.map((p: any) => ({
        id: p.id,
        familyId: p.familyId,
        familyName: p.family.name,
        subscriptionId: p.subscriptionId,
        amount: Number(p.amount),
        status: p.status as PaymentStatus,
        dueDate: p.dueDate,
        paidDate: p.paidDate,
        invoiceNumber: p.invoiceNumber,
      }))
      setPayments(formattedPayments)
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar pagamentos'
      setError(errorMessage)
      console.error('Erro ao carregar pagamentos:', err)
    }
    setLoading(false)
  }

  async function handleStatusChange(id: string, newStatus: PaymentStatus) {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao atualizar status')
      }

      setSuccess('Status atualizado com sucesso!')
      fetchPayments()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status')
      console.error('Erro ao atualizar status:', err)
    }
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session || !session.user || ((session.user as any).role !== 'OWNER' && (session.user as any).role !== 'ADMIN')) return <div>Acesso restrito.</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Gestão de Pagamentos
        </h1>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por empresa ou fatura"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-64 bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white/5 border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
            title="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {success && <div className="text-emerald-400 mb-4">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-6 py-4 text-left font-medium">Fatura</th>
                  <th className="px-6 py-4 text-left font-medium">Empresa</th>
                  <th className="px-6 py-4 text-left font-medium">Valor</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Vencimento</th>
                  <th className="px-6 py-4 text-left font-medium">Pagamento</th>
                  <th className="px-6 py-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {payments
                  .filter(p => !filter || 
                    p.familyName.toLowerCase().includes(filter.toLowerCase()) ||
                    p.invoiceNumber.toLowerCase().includes(filter.toLowerCase()) ||
                    p.status === filter
                  )
                  .map(payment => (
                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{payment.invoiceNumber}</td>
                      <td className="px-6 py-4">{payment.familyName}</td>
                      <td className="px-6 py-4">R$ {payment.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[payment.status].bg} ${statusColors[payment.status].text}`}>
                          {statusLabels[payment.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {payment.status !== PaymentStatus.paid && (
                            <button
                              onClick={() => handleStatusChange(payment.id, PaymentStatus.paid)}
                              className="p-2 rounded-lg hover:bg-white/5 text-emerald-400 transition-colors"
                              title="Marcar como pago"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          {payment.status === PaymentStatus.pending && (
                            <button
                              onClick={() => handleStatusChange(payment.id, PaymentStatus.cancelled)}
                              className="p-2 rounded-lg hover:bg-white/5 text-red-400 transition-colors"
                              title="Cancelar pagamento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 