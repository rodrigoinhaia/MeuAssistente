"use client"

import { useEffect, useState } from 'react'
import axios from 'axios'

interface Category {
  id: string
  name: string
  type: string
  color: string
  icon?: string
  isActive: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    icon: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/categories')
      setCategories(res.data.categories)
    } catch (err: any) {
      setError('Erro ao carregar categorias')
    }
    setLoading(false)
  }

  function openEditModal(cat: Category) {
    setEditId(cat.id)
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon || '',
    })
    setShowModal(true)
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('O nome é obrigatório.')
      return
    }
    setFormLoading(true)
    try {
      if (editId) {
        await axios.put(`/api/categories/${editId}`, form)
      } else {
        await axios.post('/api/categories', form)
      }
      setShowModal(false)
      setForm({ name: '', type: 'expense', color: '#3B82F6', icon: '' })
      setEditId(null)
      fetchCategories()
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erro ao salvar categoria')
    }
    setFormLoading(false)
  }

  async function handleDeleteCategory() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await axios.delete(`/api/categories/${deleteId}`)
      setDeleteId(null)
      fetchCategories()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir categoria')
    }
    setDeleteLoading(false)
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl w-full mx-auto bg-white dark:bg-black">
      <h1 className="text-2xl font-bold mb-6">Categorias</h1>
      <div className="mb-6 flex justify-between items-center">
        <span className="text-gray-600">Gerencie categorias de despesas e receitas.</span>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Nova Categoria
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Carregando categorias...</div>
      ) : categories.length === 0 ? (
        <div className="text-gray-500">Nenhuma categoria cadastrada.</div>
      ) : (
        <table className="w-full bg-white dark:bg-gray-900 rounded shadow border">
          <thead className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100">
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Cor</th>
              <th className="p-2 text-left">Ícone</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="dark:bg-gray-900 dark:text-gray-100">
            {categories.map(cat => (
              <tr key={cat.id} className="border-b dark:border-gray-700">
                <td className="p-2">{cat.name}</td>
                <td className="p-2">{cat.type === 'expense' ? 'Despesa' : 'Receita'}</td>
                <td className="p-2">
                  <span 
                    className="inline-block w-5 h-5 rounded-full border category-color"
                    style={{ '--category-color': cat.color } as React.CSSProperties}
                  ></span>
                </td>
                <td className="p-2">{cat.icon || '-'}</td>
                <td className="p-2">
                  <span className={cat.isActive ? 'text-green-700' : 'text-red-700'}>
                    {cat.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <button className="text-blue-600 hover:bg-blue-100 rounded p-1" onClick={() => openEditModal(cat)} title="Editar" aria-label="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2a2 2 0 012-2h2a2 2 0 012 2v2h6" /></svg>
                  </button>
                  <button className="text-red-600 hover:bg-red-100 rounded p-1" onClick={() => setDeleteId(cat.id)} title="Excluir" aria-label="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 2v2" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800 transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{editId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <form onSubmit={handleSaveCategory} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Nome *</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Nome da categoria"
                  title="Nome da categoria"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Tipo *</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    required
                    title="Tipo da categoria"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Cor</label>
                  <input
                    type="color"
                    className="w-12 h-8 p-0 border-none bg-transparent"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#3B82F6"
                    title="Cor da categoria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Ícone (opcional)</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="Ex: fa-solid fa-car"
                />
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
      )}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-red-700">Excluir Categoria</h2>
            <p className="mb-4">Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancelar</button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteCategory}
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