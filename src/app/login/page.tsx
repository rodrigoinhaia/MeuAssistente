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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col md:flex-row">
      {/* Lado Esquerdo - Área de Marketing */}
      <div className="md:w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            MeuAssistente
          </h1>
          <h2 className="text-2xl md:text-3xl mb-6">
            ERP feito para seu negócio ser integrado
          </h2>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {['amazon', 'mercadolivre', 'magalu', 'shopify'].map((platform) => (
              <div key={platform} className="bg-white/10 p-3 rounded-lg flex items-center justify-center h-16">
                <span className="text-gray-400 text-sm">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white/10 p-8 rounded-xl backdrop-blur-lg w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">ACESSE SUA CONTA</h2>
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">E-mail</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium block">Senha</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2" />
                <label htmlFor="remember" className="text-gray-300">Lembrar-me</label>
              </div>
              <a href="/forgot-password" className="text-cyan-400 hover:text-cyan-300">
                Recuperar Senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR NO SISTEMA'}
            </button>

            <div className="mt-6 text-center text-gray-400">
              Não tem uma conta?{' '}
              <a href="/register" className="text-cyan-400 hover:text-cyan-300">
                Cadastre-se
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 