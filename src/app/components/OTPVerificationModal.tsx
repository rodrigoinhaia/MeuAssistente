'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/axios-config'
import { RiShieldCheckLine, RiRefreshLine, RiLockPasswordLine, RiCloseLine } from 'react-icons/ri'

interface OTPVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  phoneNumber?: string
  userId?: string
  userEmail?: string // Email do usuário (para reenvio quando não autenticado)
  userPassword?: string // Senha do usuário (para verificação pública)
  isAdminVerifying?: boolean // Se true, é admin verificando outro usuário
  isPublic?: boolean // Se true, não requer autenticação (para login)
}

export default function OTPVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  phoneNumber,
  userId,
  userEmail,
  userPassword,
  isAdminVerifying = false,
  isPublic = false,
}: OTPVerificationModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Quando o modal abrir e for público, tentar enviar código automaticamente
  useEffect(() => {
    if (isOpen && isPublic && userEmail && !code) {
      // Enviar código automaticamente quando modal abrir
      const sendInitialCode = async () => {
        setResending(true)
        setError('')
        setSuccess('')
        try {
          console.log('[OTP_MODAL] Enviando código inicial para:', userEmail)
          const res = await apiClient.post('/auth/resend-otp-public', { email: userEmail })
          if (res.data.status === 'ok') {
            setSuccess('Código enviado para seu WhatsApp!')
            console.log('[OTP_MODAL] ✅ Código enviado com sucesso')
          } else {
            setError(res.data.message || 'Erro ao enviar código')
            console.error('[OTP_MODAL] ❌ Erro na resposta:', res.data)
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || err.message || 'Erro ao enviar código'
          setError(errorMsg)
          console.error('[OTP_MODAL] ❌ Erro ao enviar código inicial:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          })
        }
        setResending(false)
      }
      sendInitialCode()
    }
  }, [isOpen, isPublic, userEmail])

  if (!isOpen) return null

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
      let res
      
      // Se for público (não autenticado), usar rota pública com email e senha
      if (isPublic && userEmail && userPassword) {
        res = await apiClient.post('/auth/verify-otp-public', { 
          code, 
          email: userEmail, 
          password: userPassword 
        })
      } else if (isAdminVerifying && userId) {
        // Admin verificando outro usuário
        res = await apiClient.post('/auth/verify-otp', { code, userId })
      } else {
        // Usuário autenticado verificando a si mesmo
        res = await apiClient.post('/auth/verify-otp', { code })
      }
      
      if (res.data.status === 'ok') {
        setSuccess('WhatsApp verificado com sucesso!')
        setTimeout(() => {
          onSuccess()
          onClose()
          setCode('')
        }, 1500)
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
      // Se for público (não autenticado), usar rota pública com email
      if (isPublic && userEmail) {
        const res = await apiClient.post('/auth/resend-otp-public', { email: userEmail })
        if (res.data.status === 'ok') {
          setSuccess('Novo código enviado para o WhatsApp!')
        } else {
          const errorMsg = res.data.message || 'Erro ao reenviar código'
          const details = res.data.details ? `\n\nDetalhes: ${res.data.details}` : ''
          setError(errorMsg + details)
        }
      } else if (isAdminVerifying && userId) {
        // Admin reenviando para outro usuário
        const res = await apiClient.post('/auth/resend-otp', { userId })
        if (res.data.status === 'ok') {
          setSuccess('Novo código enviado para o WhatsApp!')
        } else {
          setError(res.data.message || 'Erro ao reenviar código')
        }
      } else {
        // Usuário autenticado reenviando para si mesmo
        const res = await apiClient.post('/auth/resend-otp', {})
        if (res.data.status === 'ok') {
          setSuccess('Novo código enviado para o WhatsApp!')
        } else {
          const errorMsg = res.data.message || 'Erro ao reenviar código'
          const details = res.data.details ? `\n\nDetalhes: ${res.data.details}` : ''
          setError(errorMsg + details)
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erro ao reenviar código'
      const details = err.response?.data?.details ? `\n\nDetalhes: ${err.response.data.details}` : ''
      setError(errorMsg + details)
      console.error('[OTP_MODAL] Erro ao reenviar:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })
    }
    setResending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <RiCloseLine className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full mb-4">
            <RiShieldCheckLine className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent mb-2">
            Verificação de WhatsApp
          </h2>
          <p className="text-slate-600 text-sm">
            {isAdminVerifying
              ? `Enviando código de verificação para o WhatsApp cadastrado.`
              : `Enviamos um código de verificação de 6 dígitos para seu WhatsApp cadastrado.`}
            {phoneNumber && (
              <span className="block mt-1 font-medium text-slate-800">{phoneNumber}</span>
            )}
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

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            O código expira em 10 minutos
          </p>
        </div>
      </div>
    </div>
  )
}

