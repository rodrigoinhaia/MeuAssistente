"use client"

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RiLockPasswordLine } from 'react-icons/ri'
import { HiOutlineMail } from 'react-icons/hi'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('Auth Response:', res)
      
      if (res?.error) {
        console.error('Auth Error:', res.error)
        setError(res.error)
      } else {
        const session = await getSession()
        console.log('Session:', session)
        
        const role = (session?.user as any)?.role
        // Redirecionar para o dashboard principal
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login Error:', error)
      setError('Erro ao realizar login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col md:flex-row">
      {/* Lado Esquerdo - Área de Marketing */}
      <div className="md:w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo-icon.svg" alt="MeuAssistente" className="w-16 h-16" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              MeuAssistente
            </h1>
          </div>
          <h2 className="text-2xl md:text-3xl mb-6 text-slate-800 font-semibold">
            O assistente de IA para sua família! <br />
            Gerencie sua vida financeira e compromissos direto no WhatsApp e no painel web.
          </h2>
          {/* <div className="grid grid-cols-3 gap-4 mt-8">
            {['amazon', 'mercadolivre', 'magalu', 'shopify'].map((platform) => (
              <div key={platform} className="bg-white border border-slate-200/60 p-3 rounded-xl flex items-center justify-center h-16 shadow-sm hover:shadow-md transition-all">
                <span className="text-slate-600 text-sm font-medium">{platform}</span>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200/60 p-8 rounded-2xl backdrop-blur-sm w-full max-w-md shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">ACESSE SUA CONTA</h2>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-slate-700 text-sm font-semibold block">E-mail</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-10 py-3 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 text-sm font-semibold block">Senha</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-10 py-3 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                <label htmlFor="remember" className="text-slate-600">Lembrar-me</label>
              </div>
              <a href="/forgot-password" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Recuperar Senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3.5 rounded-xl font-semibold shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}
            </button>

            <div className="mt-6 text-center text-slate-600">
              Não tem uma conta?{' '}
              <a href="/register" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Cadastre-se
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 