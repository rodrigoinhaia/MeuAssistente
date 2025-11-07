"use client"

import { useEffect, useState } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import { useSession } from 'next-auth/react'

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
  type: string
  status: string
  category?: { name: string; color: string }
  user?: { id: string; name: string; email: string }
}

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function TransactionsPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'USER'
  const currentUserId = (session?.user as any)?.id
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([]) // Lista de membros da família
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    type: '',
    categoryId: '',
    userId: '', // Novo filtro por usuário
    search: '',
  })

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    // Buscar lista de usuários se for OWNER
    if (userRole === 'OWNER') {
      fetchUsers()
    }
  }, [filter, userRole])

  async function fetchTransactions() {
    setLoading(true)
    setError('')
    try {
      const params: any = {}
      if (filter.startDate) params.startDate = filter.startDate
      if (filter.endDate) params.endDate = filter.endDate
      if (filter.type) params.type = filter.type
      if (filter.categoryId) params.categoryId = filter.categoryId
      if (filter.userId) params.userId = filter.userId // Adicionar filtro por usuário
      if (filter.search) params.search = filter.search
      const res = await axios.get('/api/transactions', { params })
      setTransactions(res.data.transactions)
    } catch (err: any) {
      setError('Erro ao carregar transações')
    }
    setLoading(false)
  }

  async function fetchCategories() {
    try {
      const res = await axios.get('/api/categories')
      setCategories(res.data.categories)
    } catch {}
  }

  async function fetchUsers() {
    try {
      const res = await axios.get('/api/users')
      setUsers(res.data.users || [])
    } catch {}
  }

  function openEditModal(tx: Transaction) {
    setEditId(tx.id)
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      categoryId: tx.category ? (tx as any).category.id : '',
      date: format(new Date(tx.date), 'yyyy-MM-dd'),
      status: tx.status,
    })
    setShowModal(true)
  }

  async function handleSaveTransaction(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.description.trim() || !form.amount || !form.categoryId || !form.date) {
      setFormError('Preencha todos os campos obrigatórios.')
      return
    }
    setFormLoading(true)
    try {
      if (editId) {
        await axios.put(`/api/transactions/${editId}`, {
          ...form,
          amount: Number(form.amount.replace(',', '.')),
        })
      } else {
        await axios.post('/api/transactions', {
          ...form,
          amount: Number(form.amount.replace(',', '.')),
        })
      }
      setShowModal(false)
      setForm({ description: '', amount: '', type: 'expense', categoryId: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' })
      setEditId(null)
      fetchTransactions()
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erro ao salvar transação')
    }
    setFormLoading(false)
  }

  async function handleDeleteTransaction() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await axios.delete(`/api/transactions/${deleteId}`)
      setDeleteId(null)
      fetchTransactions()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir transação')
    }
    setDeleteLoading(false)
  }

  function exportToCSV(transactions: Transaction[]) {
    const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.category ? tx.category.name : '-',
      tx.type === 'expense' ? 'Despesa' : 'Receita',
      Number(tx.amount).toFixed(2).replace('.', ','),
      tx.status === 'paid' ? 'Paga' : tx.status === 'overdue' ? 'Vencida' : 'Pendente',
    ])
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `transacoes-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl w-full mx-auto bg-white dark:bg-black">
      <h1 className="text-2xl font-bold mb-6">Transações</h1>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Data inicial</label>
            <input
              type="date"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border dark:border-gray-700"
              value={filter.startDate}
              onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))}
              title="Data inicial"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Data final</label>
            <input
              type="date"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border dark:border-gray-700"
              value={filter.endDate}
              onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))}
              title="Data final"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tipo</label>
            <select
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border dark:border-gray-700"
              value={filter.type}
              onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              title="Tipo da transação"
            >
              <option value="">Todos</option>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Categoria</label>
            <select
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border dark:border-gray-700"
              value={filter.categoryId}
              onChange={e => setFilter(f => ({ ...f, categoryId: e.target.value }))}
              title="Categoria da transação"
            >
              <option value="">Todas</option>
              {categories
                .filter(cat => !filter.type || cat.type === filter.type)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
          </div>
          {(userRole === 'OWNER') && (
            <div>
              <label className="block text-xs font-medium mb-1">Membro</label>
              <select
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700"
                value={filter.userId}
                onChange={e => setFilter(f => ({ ...f, userId: e.target.value }))}
              >
                <option value="">Todos</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">Buscar</label>
            <input
              type="text"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border dark:border-gray-700"
              placeholder="Descrição"
              title="Descrição da transação"
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            + Nova Transação
          </button>
          <button
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 border"
            onClick={() => exportToCSV(transactions)}
            disabled={transactions.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Carregando transações...</div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-500">Nenhuma transação cadastrada.</div>
      ) : (
        <table className="w-full bg-white dark:bg-gray-900 rounded shadow border">
          <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100">
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Responsável</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Valor</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="dark:bg-gray-900 dark:text-gray-100">
            {transactions.map(tx => {
              const canEdit = userRole === 'OWNER' || (userRole === 'USER' && tx.user?.id === currentUserId)
              return (
                <tr key={tx.id} className="border-b dark:border-gray-700">
                  <td className="p-2">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-2">{tx.description}</td>
                  <td className="p-2">
                    {tx.user ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                        <span>👤</span>
                        {tx.user.name}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-2">
                    {tx.category ? (
                      <span className="inline-block w-5 h-5 rounded-full border transaction-color" style={{ '--transaction-color': tx.category.color } as React.CSSProperties}>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-2">{tx.type === 'expense' ? 'Despesa' : 'Receita'}</td>
                  <td className="p-2 font-mono">R$ {Number(tx.amount).toFixed(2)}</td>
                  <td className="p-2">
                    <span className={tx.status === 'paid' ? 'text-green-700' : tx.status === 'overdue' ? 'text-red-700' : 'text-yellow-700'}>
                      {tx.status === 'paid' ? 'Paga' : tx.status === 'overdue' ? 'Vencida' : 'Pendente'}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    {canEdit && (
                      <button className="text-blue-600 hover:bg-blue-100 rounded p-1" onClick={() => openEditModal(tx)} title="Editar" aria-label="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2a2 2 0 012-2h2a2 2 0 012 2v2h6" /></svg>
                      </button>
                    )}
                    {canEdit && (
                      <button className="text-red-600 hover:bg-red-100 rounded p-1" onClick={() => setDeleteId(tx.id)} title="Excluir" aria-label="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 2v2" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {showModal ? (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800 transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{editId ? 'Editar Transação' : 'Nova Transação'}</h2>
            <form onSubmit={handleSaveTransaction} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Descrição *</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  placeholder="Descrição"
                  title="Descrição da transação"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  placeholder="Valor da transação"
                  title="Valor da transação"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Tipo *</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value, categoryId: '' }))}
                    required
                    title="Tipo da transação"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Categoria *</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    required
                    title="Categoria da transação"
                  >
                    <option value="">Selecione</option>
                    {categories.filter(c => c.type === form.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Data *</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    title="Data da transação"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Status *</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    required
                    title="Status da transação"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Paga</option>
                    <option value="overdue">Vencida</option>
                  </select>
                </div>
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  onClick={() => { setShowModal(false); setEditId(null); }}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                  disabled={formLoading}
                >
                  {formLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-red-700">Excluir Transação</h2>
            <p className="mb-4">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancelar</button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteTransaction}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
} 