'use client'

import { type ReactElement } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { RiLockPasswordLine, RiUserLine, RiMapPinLine } from 'react-icons/ri'
import { HiOutlineMail, HiOutlineIdentification } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'

export default function RegisterPage(): ReactElement {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    whatsappCode: '',
    whatsappVerified: false,
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [codeSuccess, setCodeSuccess] = useState('')
  const [step, setStep] = useState(1) // 1: Dados básicos, 2: Endereço

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCepBlur = async () => {
    if (form.cep.length === 8 || form.cep.length === 9) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${form.cep.replace(/\D/g, '')}/json/`)
        const data = await res.json()
        if (data.erro) {
          setError('CEP não encontrado')
        } else {
          setForm(f => ({
            ...f,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }))
          setError('')
        }
      } catch {
        setError('Erro ao buscar CEP')
      }
    }
  }

  const handleSendCode = async () => {
    setSendingCode(true)
    setCodeError('')
    setCodeSuccess('')
    try {
      const res = await axios.post('/api/auth/send-whatsapp-code', {
        phone: form.phone,
      })
      if (res.data.status === 'ok') {
        setCodeSent(true)
        setCodeSuccess('Código enviado para o WhatsApp!')
      } else {
        setCodeError(res.data.message || 'Erro ao enviar código')
      }
    } catch (err: any) {
      setCodeError(err.response?.data?.message || 'Erro ao enviar código')
    }
    setSendingCode(false)
  }

  const handleVerifyCode = async () => {
    setCodeError('')
    setCodeSuccess('')
    try {
      const res = await axios.post('/api/auth/verify-whatsapp-code', {
        phone: form.phone,
        code: form.whatsappCode,
      })
      if (res.data.status === 'ok') {
        setForm(f => ({ ...f, whatsappVerified: true }))
        setCodeSuccess('WhatsApp verificado com sucesso!')
      } else {
        setCodeError(res.data.message || 'Código inválido ou expirado')
      }
    } catch (err: any) {
      setCodeError(err.response?.data?.message || 'Código inválido ou expirado')
    }
  }

  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    let sum = 0, rest
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(cpf.substring(9, 10))) return false
    sum = 0
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(cpf.substring(10, 11))) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!isValidCPF(form.cpf)) {
        setError('CPF inválido')
        return
      }
      if (!form.whatsappVerified) {
        setError('É necessário verificar o WhatsApp')
        return
      }
      setStep(2)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: form.cpf,
        phone: form.phone, // O backend espera 'phone' para o usuário
        familyName: form.name,
        address: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
      })

      if (res.data.status === 'ok') {
        setSuccess('Cadastro realizado com sucesso! Redirecionando...')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(res.data.message || 'Erro ao registrar')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar')
    }
    setLoading(false)
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
            Comece agora mesmo a gerenciar seu negócio
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

      {/* Lado Direito - Formulário de Registro */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-white/10 p-8 rounded-xl backdrop-blur-lg w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? 'CRIAR CONTA' : 'ENDEREÇO'}
            </h2>
            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-400 text-sm mt-2">{success}</div>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">Nome completo</label>
                    <div className="relative">
                      <RiUserLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">E-mail</label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">Senha</label>
                    <div className="relative">
                      <RiLockPasswordLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">CPF</label>
                    <div className="relative">
                      <HiOutlineIdentification className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="cpf"
                        type="text"
                        value={form.cpf}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                        maxLength={14}
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FaWhatsapp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          name="phone"
                          type="text"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                          required
                          disabled={form.whatsappVerified}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={sendingCode || !form.phone || form.whatsappVerified}
                        className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50"
                      >
                        {sendingCode ? 'Enviando...' : form.whatsappVerified ? 'Verificado' : 'Verificar'}
                      </button>
                    </div>
                    {codeSent && !form.whatsappVerified && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          name="whatsappCode"
                          placeholder="Código"
                          value={form.whatsappCode}
                          onChange={handleChange}
                          className="flex-1 bg-white/5 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-400"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200"
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                    {codeSuccess && <div className="text-green-400 text-xs mt-1">{codeSuccess}</div>}
                    {codeError && <div className="text-red-400 text-xs mt-1">{codeError}</div>}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  PRÓXIMO
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {/* CEP */}
                  <div className="space-y-2">
                    <label className="text-white text-sm font-medium block">CEP</label>
                    <div className="relative">
                      <RiMapPinLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="cep"
                        type="text"
                        value={form.cep}
                        onChange={handleChange}
                        onBlur={handleCepBlur}
                        className="w-full bg-white/5 border border-gray-600 text-white px-10 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                        maxLength={9}
                      />
                    </div>
                  </div>

                  {/* Endereço - 2 colunas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Rua</label>
                      <input
                        name="street"
                        type="text"
                        value={form.street}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Número</label>
                      <input
                        name="number"
                        type="text"
                        value={form.number}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Complemento e Bairro */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Complemento</label>
                      <input
                        name="complement"
                        type="text"
                        value={form.complement}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Bairro</label>
                      <input
                        name="neighborhood"
                        type="text"
                        value={form.neighborhood}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Cidade e Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Cidade</label>
                      <input
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium block">Estado</label>
                      <input
                        name="state"
                        type="text"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/2 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200"
                  >
                    VOLTAR
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-gray-400">
              Já tem uma conta?{' '}
              <a href="/login" className="text-cyan-400 hover:text-cyan-300">
                Entrar
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
