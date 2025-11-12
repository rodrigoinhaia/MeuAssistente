"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiClient from '@/lib/axios-config'
import {
  RiCheckboxCircleLine,
  RiBankCardLine,
  RiQrCodeLine,
  RiArrowLeftLine,
} from 'react-icons/ri'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>('CREDIT_CARD')

  useEffect(() => {
    if (!planId) {
      router.push('/dashboard/upgrade')
      return
    }

    async function loadPlan() {
      try {
        const res = await apiClient.get('/plans/public')
        if (res.data.status === 'ok') {
          const foundPlan = res.data.plans.find((p: Plan) => p.id === planId)
          if (foundPlan) {
            setPlan(foundPlan)
          } else {
            setError('Plano não encontrado')
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar plano')
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [planId, router])

  async function handlePayment() {
    if (!plan) return

    setProcessing(true)
    setError('')

    try {
      // Criar assinatura e processar pagamento
      const res = await apiClient.post('/subscriptions/create', {
        planId: plan.id,
        paymentMethod,
      })

      if (res.data.status === 'ok') {
        // Se tiver URL de pagamento (boleto/PIX), redirecionar
        if (res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl
        } else if (res.data.invoiceUrl) {
          window.location.href = res.data.invoiceUrl
        } else {
          // Pagamento processado com sucesso
          router.push('/dashboard/subscriptions?success=true')
        }
      } else {
        setError(res.data.message || 'Erro ao processar pagamento')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">{error || 'Plano não encontrado'}</p>
          <button
            onClick={() => router.push('/dashboard/upgrade')}
            className="mt-4 text-cyan-600 hover:text-cyan-700 font-medium underline"
          >
            Voltar para escolher plano
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
          Finalizar Assinatura
        </h1>
        <p className="text-slate-600 mt-2">Confirme os dados e escolha a forma de pagamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumo do Plano */}
        <div className="md:col-span-2 space-y-6">
          {/* Plano Selecionado */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Plano Selecionado</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{plan.name}</h3>
                <p className="text-slate-600 text-sm">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-slate-500">/mês</div>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-2">Inclui:</p>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <RiCheckboxCircleLine className="w-4 h-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Forma de Pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <RiBankCardLine className={`w-6 h-6 mb-2 ${paymentMethod === 'CREDIT_CARD' ? 'text-cyan-600' : 'text-slate-400'}`} />
                <p className="font-medium text-slate-800">Cartão de Crédito</p>
                <p className="text-xs text-slate-500 mt-1">Aprovação imediata</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BOLETO')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === 'BOLETO'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <RiBankCardLine className={`w-6 h-6 mb-2 ${paymentMethod === 'BOLETO' ? 'text-cyan-600' : 'text-slate-400'}`} />
                <p className="font-medium text-slate-800">Boleto</p>
                <p className="text-xs text-slate-500 mt-1">Vencimento em 3 dias</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('PIX')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === 'PIX'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <RiQrCodeLine className={`w-6 h-6 mb-2 ${paymentMethod === 'PIX' ? 'text-cyan-600' : 'text-slate-400'}`} />
                <p className="font-medium text-slate-800">PIX</p>
                <p className="text-xs text-slate-500 mt-1">Aprovação imediata</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Resumo do Pedido */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Resumo</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-700">
                <span>Plano {plan.name}</span>
                <span className="font-medium">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Período</span>
                <span className="font-medium">Mensal</span>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between text-lg font-bold text-slate-800">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                    R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processando...' : 'Confirmar e Pagar'}
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              🔒 Pagamento seguro processado pela Asaas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

