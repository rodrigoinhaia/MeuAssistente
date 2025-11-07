"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios-config'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiArrowRightLine,
  RiTimeLine,
} from 'react-icons/ri'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

export default function UpgradePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [trialStatus, setTrialStatus] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, trialRes] = await Promise.all([
          apiClient.get('/plans/public'),
          apiClient.get('/subscriptions/check-trial'),
        ])

        if (plansRes.data.status === 'ok') {
          setPlans(plansRes.data.plans || [])
        }

        if (trialRes.data) {
          setTrialStatus(trialRes.data)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSelectPlan(planId: string) {
    // Redirecionar para checkout/pagamento
    router.push(`/dashboard/checkout?planId=${planId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-4">
          {trialStatus?.trialExpired ? 'Seu Trial Expirou' : 'Escolha Seu Plano'}
        </h1>
        <p className="text-slate-600 text-lg">
          {trialStatus?.trialExpired
            ? 'Para continuar usando o sistema, escolha um plano abaixo'
            : trialStatus?.isTrial
            ? `Você tem ${trialStatus.daysRemaining} dias restantes no trial. Escolha um plano para continuar após o período grátis.`
            : 'Escolha o plano ideal para sua família'}
        </p>
      </div>

      {/* Status do Trial */}
      {trialStatus?.isTrial && !trialStatus.trialExpired && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <RiTimeLine className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-blue-800">Trial Ativo</p>
          </div>
          <p className="text-blue-700">
            Seu trial expira em{' '}
            <strong>
              {trialStatus.trialEndDate
                ? format(new Date(trialStatus.trialEndDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'breve'}
            </strong>
          </p>
        </div>
      )}

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-cyan-300 transition-all shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-800">{plan.name}</h3>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-slate-500">/mês</div>
              </div>
            </div>

            <p className="text-slate-600 mb-6">{plan.description}</p>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <RiCheckboxCircleLine className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.id)}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              Escolher Plano
              <RiArrowRightLine className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Aviso */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-slate-600 text-sm">
          💳 Pagamento seguro via Asaas. Você pode cancelar a qualquer momento.
        </p>
      </div>
    </div>
  )
}

