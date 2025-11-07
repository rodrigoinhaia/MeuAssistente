"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAdminContext } from '@/hooks/useAdminContext'
import apiClient from '@/lib/axios-config'

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
    bg: 'bg-yellow-100 border border-yellow-200',
    text: 'text-yellow-700',
  },
  [PaymentStatus.paid]: {
    bg: 'bg-emerald-100 border border-emerald-200',
    text: 'text-emerald-700',
  },
  [PaymentStatus.overdue]: {
    bg: 'bg-red-100 border border-red-200',
    text: 'text-red-700',
  },
  [PaymentStatus.cancelled]: {
    bg: 'bg-slate-100 border border-slate-200',
    text: 'text-slate-700',
  },
  [PaymentStatus.failed]: {
    bg: 'bg-red-100 border border-red-200',
    text: 'text-red-700',
  },
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const { isAdminMode } = useAdminContext()
  const userRole = (session?.user as any)?.role
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    // OWNER ou SUPER_ADMIN em modo admin podem ver pagamentos
    if (status === 'authenticated' && (userRole === 'OWNER' || (userRole === 'SUPER_ADMIN' && isAdminMode))) {
      fetchPayments()
    }
  }, [status, session, userRole, isAdminMode])

  async function fetchPayments() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/payments')
      const data = res.data

      if (res.status !== 200) {
        throw new Error(data.error || 'Erro ao buscar pagamentos')
      }

      const formattedPayments: Payment[] = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: p.id,
        familyId: p.familyId,
        familyName: p.family?.name || 'N/A',
        subscriptionId: p.subscriptionId,
        amount: Number(p.amount),
        status: p.status as PaymentStatus,
        dueDate: p.dueDate,
        paidDate: p.paidDate,
        invoiceNumber: p.invoiceNumber,
      }))
      setPayments(formattedPayments)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao carregar pagamentos'
      setError(errorMessage)
      console.error('Erro ao carregar pagamentos:', err)
    }
    setLoading(false)
  }

  async function handleStatusChange(id: string, newStatus: PaymentStatus) {
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.patch('/payments', { id, status: newStatus })

      if (res.status !== 200) {
        throw new Error(res.data?.error || 'Erro ao atualizar status')
      }

      setSuccess('Status atualizado com sucesso!')
      fetchPayments()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao atualizar status')
      console.error('Erro ao atualizar status:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }
  
  // OWNER ou SUPER_ADMIN em modo admin podem ver pagamentos
  if (!session || !session.user || (userRole !== 'OWNER' && (userRole !== 'SUPER_ADMIN' || !isAdminMode))) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Acesso restrito.</p>
          <p className="text-sm mt-1">Apenas Owners ou Super Admins no modo Admin podem ver pagamentos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Gestão de Pagamentos
          </h1>
          <p className="text-slate-600 mt-1">Gerencie pagamentos e faturas</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por família ou fatura"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-64 bg-white border border-slate-200/60 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white border border-slate-200/60 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
            title="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Fatura</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Família</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Valor</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Vencimento</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Pagamento</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments
                  .filter(p => !filter || 
                    p.familyName.toLowerCase().includes(filter.toLowerCase()) ||
                    p.invoiceNumber.toLowerCase().includes(filter.toLowerCase()) ||
                    p.status === filter
                  )
                  .map(payment => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{payment.invoiceNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{payment.familyName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">R$ {payment.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[payment.status].bg} ${statusColors[payment.status].text}`}>
                          {statusLabels[payment.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('pt-BR') : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {payment.status !== PaymentStatus.paid && (
                            <button
                              onClick={() => handleStatusChange(payment.id, PaymentStatus.paid)}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-transparent hover:border-emerald-200 transition-colors"
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
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition-colors"
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