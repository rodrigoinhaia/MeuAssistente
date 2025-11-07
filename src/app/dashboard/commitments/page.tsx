"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import 'react-calendar/dist/Calendar.css'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { ptBR } from 'date-fns/locale'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

interface Commitment {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  status: string
  googleEventId: string | null
  user: { name: string }
}

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
})

export default function CommitmentsPage() {
  const { data: session, status } = useSession()
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    status: 'scheduled',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [editForm, setEditForm] = useState<null | Commitment>(null)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [filter, setFilter] = useState<'today' | '7days' | '30days' | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [view, setView] = useState<View>(Views.MONTH)
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    fetchCommitments()
  }, [])

  async function fetchCommitments() {
    setLoading(true)
    try {
      const res = await axios.get('/api/commitments')
      setCommitments(res.data.commitments)
    } catch (err: any) {
      setError('Erro ao carregar compromissos')
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res = await axios.post('/api/commitments', form)
      if (res.data.status === 'ok') {
        setSuccess('Compromisso criado com sucesso!')
        setShowForm(false)
        fetchCommitments()
        setForm({ title: '', description: '', date: '', time: '', status: 'scheduled' })
      } else {
        setError(res.data.message || 'Erro ao criar compromisso')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar compromisso')
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')
    if (!editForm) return
    try {
      const res = await axios.patch('/api/commitments', {
        id: editForm.id,
        title: editForm.title,
        description: editForm.description,
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
      })
      if (res.data.status === 'ok') {
        setEditSuccess('Compromisso atualizado com sucesso!')
        setEditForm(null)
        fetchCommitments()
      } else {
        setEditError(res.data.message || 'Erro ao atualizar compromisso')
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Erro ao atualizar compromisso')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleteError('')
    setDeleteSuccess('')
    try {
      const res = await axios.delete('/api/commitments', { data: { id: deleteId } })
      if (res.data.status === 'ok') {
        setDeleteSuccess('Compromisso excluído com sucesso!')
        setDeleteId(null)
        fetchCommitments()
      } else {
        setDeleteError(res.data.message || 'Erro ao excluir compromisso')
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Erro ao excluir compromisso')
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'scheduled': return 'Agendado'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  // Mapeia compromissos para eventos do calendário
  const events = commitments.map(c => {
    // Garante que a data está no formato correto
    const dateStr = c.date.length > 10 ? c.date.slice(0, 10) : c.date
    let start: Date, end: Date
    if (c.time) {
      start = new Date(`${dateStr}T${c.time}`)
      end = new Date(`${dateStr}T${c.time}`)
    } else {
      start = new Date(dateStr)
      end = new Date(dateStr)
      end.setHours(23, 59, 59, 999) // cobre o dia todo
    }
    return {
      id: c.id,
      title: c.title,
      start,
      end,
      allDay: !c.time,
      resource: c,
    }
  })

  // Função para filtrar compromissos conforme o filtro selecionado
  function filterCommitmentsByRange() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (filter === 'today') {
      return commitments.filter(c => {
        const cDate = new Date(c.date)
        cDate.setHours(0, 0, 0, 0)
        return cDate.getTime() === now.getTime()
      })
    }
    if (filter === '7days') {
      const end = new Date(now)
      end.setDate(end.getDate() + 7)
      return commitments.filter(c => {
        const cDate = new Date(c.date)
        cDate.setHours(0, 0, 0, 0)
        return cDate >= now && cDate < end
      })
    }
    if (filter === '30days') {
      const end = new Date(now)
      end.setDate(end.getDate() + 30)
      return commitments.filter(c => {
        const cDate = new Date(c.date)
        cDate.setHours(0, 0, 0, 0)
        return cDate >= now && cDate < end
      })
    }
    return commitments
  }

  const filteredCommitments = filterCommitmentsByRange()

  // Função para definir cor do evento no calendário
  const eventPropGetter = useCallback((event: any) => {
    let bg = '#2563eb'; // azul padrão
    if (event.resource.status === 'completed') bg = '#22c55e'; // verde
    if (event.resource.status === 'cancelled') bg = '#ef4444'; // vermelho
    return {
      style: {
        backgroundColor: bg,
        borderRadius: '8px',
        color: '#fff',
        border: 'none',
        fontWeight: 500,
        fontSize: '1em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }
    }
  }, [])

  const DragAndDropCalendar = withDragAndDrop(BigCalendar)

  // Handler para drag & drop de eventos
  async function handleEventDrop({ event, start, end }: any) {
    try {
      await axios.patch('/api/commitments', {
        id: event.id,
        date: start.toISOString().slice(0, 10),
        time: start.toTimeString().slice(0, 5),
      })
      fetchCommitments()
    } catch (err) {
      alert('Erro ao mover compromisso!')
    }
  }

  // Handler para resize de eventos (opcional, pode ser igual ao drop)
  async function handleEventResize({ event, start, end }: any) {
    try {
      await axios.patch('/api/commitments', {
        id: event.id,
        date: start.toISOString().slice(0, 10),
        time: start.toTimeString().slice(0, 5),
      })
      fetchCommitments()
    } catch (err) {
      alert('Erro ao redimensionar compromisso!')
    }
  }

  // Handler para criação rápida de evento
  function handleSelectSlot(slotInfo: any) {
    setForm({
      title: '',
      description: '',
      date: slotInfo.start.toISOString().slice(0, 10),
      time: slotInfo.start.toTimeString().slice(0, 5),
      status: 'scheduled',
    })
    setShowForm(true)
  }

  if (status === 'loading') return <div>Carregando sessão...</div>
  if (!session) return <div>Você precisa estar autenticado.</div>

  return (
    <main className="p-4 md:p-8 max-w-7xl w-full mx-auto">
      <h1 className="text-3xl font-bold mb-8">Compromissos</h1>
      
      <button
        className="bg-primary text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowForm(true)}
      >
        Adicionar Compromisso
      </button>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          date={calendarDate}
          onNavigate={setCalendarDate}
          style={{ height: 600, width: '100%' }}
          messages={{
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Programação',
            today: 'Hoje',
            previous: 'Anterior',
            next: 'Próximo',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Nenhum compromisso neste período.',
            showMore: (total: number) => `+${total} mais`,
          }}
          culture="pt-BR"
          popup
          eventPropGetter={eventPropGetter}
          onSelectEvent={event => setSelectedEvent(event)}
          draggableAccessor={() => true}
          resizable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          onSelectSlot={handleSelectSlot}
        />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded ${filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} transition`}
            onClick={() => setFilter('today')}
          >Hoje</button>
          <button
            className={`px-3 py-1 rounded ${filter === '7days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} transition`}
            onClick={() => setFilter('7days')}
          >Próx. 7 dias</button>
          <button
            className={`px-3 py-1 rounded ${filter === '30days' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} transition`}
            onClick={() => setFilter('30days')}
          >Próx. 30 dias</button>
          <button
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} transition`}
            onClick={() => setFilter('all')}
          >Todos</button>
        </div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>Compromissos</span>
        </h2>
        {filteredCommitments.length > 0 ? (
          <ul className="space-y-3 dark:text-gray-100">
            {filteredCommitments.map(commitment => (
              <li key={commitment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow transition dark:bg-gray-800">
                <div>
                  <span className="font-medium text-lg text-blue-700">{commitment.title}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    📅 {new Date(commitment.date).toLocaleDateString()} {commitment.time && <>| 🕐 {commitment.time}</>}
                  </span>
                  {commitment.description && <div className="text-xs text-gray-500 mt-1">{commitment.description}</div>}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 md:mt-0">
                  <span className={`px-2 py-1 rounded text-xs w-fit ${getStatusColor(commitment.status)}`}>{getStatusText(commitment.status)}</span>
                  <button
                    className="text-blue-600 hover:bg-blue-100 rounded p-1"
                    title="Editar compromisso"
                    aria-label="Editar"
                    onClick={() => setEditForm(commitment)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2a2 2 0 012-2h2a2 2 0 012 2v2h6" /></svg>
                  </button>
                  <button
                    className="text-red-600 hover:bg-red-100 rounded p-1"
                    title="Excluir compromisso"
                    aria-label="Excluir"
                    onClick={() => setDeleteId(commitment.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 2v2" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">Nenhum compromisso encontrado para este filtro.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800 transition-all space-y-5"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{editForm ? 'Editar Compromisso' : 'Novo Compromisso'}</h2>
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Título *</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                placeholder="Título do compromisso"
                title="Título do compromisso"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Descrição</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição do compromisso"
                title="Descrição do compromisso"
                rows={2}
              />
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
                  title="Data do compromisso"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Hora</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  title="Hora do compromisso"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400">Status *</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                required
                title="Status do compromisso"
              >
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white p-8 rounded shadow-lg w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-bold mb-2">Editar Compromisso</h2>
            {editError && <div className="text-red-600 mb-2">{editError}</div>}
            {editSuccess && <div className="text-green-600 mb-2">{editSuccess}</div>}
            <div>
              <label className="block text-sm font-medium">Título</label>
              <input
                name="title"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                placeholder="Título do compromisso"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Descrição</label>
              <textarea
                name="description"
                value={editForm.description || ''}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Descrição (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Data</label>
              <input
                title="Data do compromisso"
                name="date"
                type="date"
                value={editForm.date.slice(0, 10)}
                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Hora</label>
              <input
                title="Hora do compromisso"
                name="time"
                type="time"
                value={editForm.time || ''}
                onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Hora (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                title="Status do compromisso"
                name="status"
                value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setEditForm(null)}
              >Cancelar</button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >Salvar</button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold mb-2 text-red-700">Confirmar Exclusão</h2>
            {deleteError && <div className="text-red-600 mb-2">{deleteError}</div>}
            {deleteSuccess && <div className="text-green-600 mb-2">{deleteSuccess}</div>}
            <p>Tem certeza que deseja excluir este compromisso? Esta ação não poderá ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setDeleteId(null)}
              >Cancelar</button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold mb-2">Detalhes do Compromisso</h2>
            <div>
              <span className="font-medium text-lg text-blue-700">{selectedEvent.title}</span>
              {selectedEvent.resource.time && <span className="ml-2 text-xs text-gray-500">🕐 {selectedEvent.resource.time}</span>}
              {selectedEvent.resource.description && <div className="text-xs text-gray-500 mt-1">{selectedEvent.resource.description}</div>}
              <div className="text-xs text-gray-500 mt-2">{new Date(selectedEvent.resource.date).toLocaleDateString()} {selectedEvent.resource.time}</div>
              <span className={`mt-2 px-2 py-1 rounded text-xs w-fit inline-block ${getStatusColor(selectedEvent.resource.status)}`}>{getStatusText(selectedEvent.resource.status)}</span>
              {selectedEvent.resource.googleEventId && (
                <a
                  href={`https://calendar.google.com/calendar/u/0/r/eventedit/${selectedEvent.resource.googleEventId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 hover:underline mt-2"
                >Abrir no Google Calendar</a>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setSelectedEvent(null)}
              >Fechar</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => { setEditForm(selectedEvent.resource); setSelectedEvent(null); }}
              >Editar</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => { setDeleteId(selectedEvent.resource.id); setSelectedEvent(null); }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
} 