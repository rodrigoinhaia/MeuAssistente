'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios-config'
import { RiShieldCheckLine, RiRefreshLine, RiLockPasswordLine } from 'react-icons/ri'

export default function VerifyPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Se não estiver autenticado, redirecionar para login
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    // Se já estiver verificado, redirecionar para dashboard
    else if (status === 'authenticated' && (session?.user as any)?.isVerified) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!code || code.length !== 6) {
      setError('Digite o código de 6 dígitos')
      setLoading(false)
      return
    }

    try {
      const res = await apiClient.post('/auth/verify-otp', { code })
      
      if (res.data.status === 'ok') {
        setSuccess('WhatsApp verificado com sucesso!')
        
        // Atualizar sessão
        await update()
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setError(res.data.message || 'Código inválido')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao verificar código')
    }
    setLoading(false)
  }

  async function handleResend() {
    setError('')
    setSuccess('')
    setResending(true)

    try {
      const res = await apiClient.post('/auth/resend-otp')
      
      if (res.data.status === 'ok') {
        setSuccess('Novo código enviado para seu WhatsApp!')
      } else {
        setError(res.data.message || 'Erro ao reenviar código')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao reenviar código')
    }
    setResending(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/60">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full mb-4">
              <RiShieldCheckLine className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">
              Verificação de WhatsApp
            </h1>
            <p className="text-slate-600 text-sm">
              Enviamos um código de verificação de 6 dígitos para seu WhatsApp cadastrado.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <RiLockPasswordLine className="w-4 h-4" />
                Código de Verificação
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  // Aceitar apenas números e limitar a 6 dígitos
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Digite o código de 6 dígitos recebido no WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RiShieldCheckLine className="w-5 h-5" />
                  Verificar Código
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RiRefreshLine className="w-4 h-4" />
                  Não recebeu o código? Reenviar
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              O código expira em 10 minutos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

