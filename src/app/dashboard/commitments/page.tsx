"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import apiClient from '@/lib/axios-config'
import dynamic from 'next/dynamic'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { ptBR } from 'date-fns/locale'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import {
  RiAddLine,
  RiCalendarLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiEditLine,
  RiDeleteBinLine,
  RiGoogleFill,
  RiRefreshLine,
  RiSyncLine,
  RiSearchLine,
  RiFilterLine,
  RiUserLine
} from 'react-icons/ri'

interface Commitment {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  googleEventId: string | null
  user: { name: string }
  createdAt: string
}

const locales = { 'pt-BR': ptBR }
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
})

const DragAndDropCalendar = withDragAndDrop(BigCalendar)

export default function CommitmentsPage() {
  const { data: session, status } = useSession()
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [hasGoogleIntegration, setHasGoogleIntegration] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  })
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [view, setView] = useState<View>(Views.MONTH)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCommitments()
      checkGoogleIntegration()
    }
  }, [status])

  async function checkGoogleIntegration() {
    try {
      const res = await apiClient.get('/integrations')
      const googleIntegration = res.data.integrations?.find((i: any) => i.provider === 'google' && i.isActive)
      setHasGoogleIntegration(!!googleIntegration)
    } catch (err) {
      // Ignorar erro, apenas não mostrar botão de sincronização
    }
  }

  async function fetchCommitments() {
    setLoading(true)
    try {
      const res = await apiClient.get('/commitments')
      setCommitments(res.data.commitments || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar compromissos')
    }
    setLoading(false)
  }

  async function handleSyncToGoogle() {
    setSyncing(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.post('/sync/google-calendar', {
        action: 'sync_to_google'
      })
      
      if (res.data.error) {
        setError(res.data.error)
      } else {
        const successCount = res.data.results?.filter((r: any) => r.status === 'success').length || 0
        setSuccess(`${successCount} compromisso(s) sincronizado(s) com Google Calendar!`)
        fetchCommitments()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao sincronizar com Google Calendar')
    }
    setSyncing(false)
  }

  async function handleSyncFromGoogle() {
    setSyncing(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiClient.post('/sync/google-calendar', {
        action: 'sync_from_google'
      })
      
      if (res.data.error) {
        setError(res.data.error)
      } else {
        const importedCount = res.data.importedCount || 0
        setSuccess(`${importedCount} evento(s) importado(s) do Google Calendar!`)
        fetchCommitments()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao importar do Google Calendar')
    }
    setSyncing(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const method = editingCommitment ? 'patch' : 'post'
      const url = editingCommitment ? '/commitments' : '/commitments'
      const data = editingCommitment 
        ? { id: editingCommitment.id, ...form }
        : form

      const res = await apiClient[method](url, data)
      
      if (res.data.status === 'ok') {
        setSuccess(editingCommitment ? 'Compromisso atualizado com sucesso!' : 'Compromisso criado com sucesso!')
        setShowForm(false)
        setEditingCommitment(null)
        fetchCommitments()
        setForm({ title: '', description: '', date: '', time: '', status: 'scheduled' })
      } else {
        setError(res.data.message || 'Erro ao salvar compromisso')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar compromisso')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este compromisso?')) return
    
    try {
      const res = await apiClient.delete('/commitments', { data: { id } })
      if (res.data.status === 'ok') {
        setSuccess('Compromisso excluído com sucesso!')
        fetchCommitments()
        setSelectedEvent(null)
      } else {
        setError(res.data.message || 'Erro ao excluir compromisso')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir compromisso')
    }
  }

  function openEditForm(commitment: Commitment) {
    setEditingCommitment(commitment)
    setForm({
      title: commitment.title,
      description: commitment.description || '',
      date: commitment.date.split('T')[0],
      time: commitment.time || '',
      status: commitment.status,
    })
    setShowForm(true)
    setSelectedEvent(null)
  }

  function openNewForm() {
    setEditingCommitment(null)
    setForm({ title: '', description: '', date: '', time: '', status: 'scheduled' })
    setShowForm(true)
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          label: 'Concluído',
          icon: <RiCheckboxCircleLine className="w-4 h-4" />
        }
      case 'cancelled':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          label: 'Cancelado',
          icon: <RiCloseCircleLine className="w-4 h-4" />
        }
      case 'scheduled':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          label: 'Agendado',
          icon: <RiCalendarLine className="w-4 h-4" />
        }
      default:
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          label: status,
          icon: <RiCalendarLine className="w-4 h-4" />
        }
    }
  }

  // Mapeia compromissos para eventos do calendário
  const events = useMemo(() => {
    return commitments
      .filter(c => {
        const matchesSearch = !searchQuery || 
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus
        return matchesSearch && matchesStatus
      })
      .map(c => {
        const dateStr = c.date.length > 10 ? c.date.slice(0, 10) : c.date
        let start: Date, end: Date
        if (c.time) {
          start = new Date(`${dateStr}T${c.time}`)
          end = new Date(`${dateStr}T${c.time}`)
          end.setHours(end.getHours() + 1)
        } else {
          start = new Date(dateStr)
          end = new Date(dateStr)
          end.setHours(23, 59, 59, 999)
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
  }, [commitments, searchQuery, filterStatus])

  // Função para definir cor do evento no calendário
  const eventPropGetter = useCallback((event: any) => {
    let bg = '#06b6d4' // cyan padrão
    if (event.resource.status === 'completed') bg = '#10b981' // emerald
    if (event.resource.status === 'cancelled') bg = '#ef4444' // red
    return {
      style: {
        backgroundColor: bg,
        borderRadius: '8px',
        color: '#fff',
        border: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '4px 8px',
      }
    }
  }, [])

  // Handler para drag & drop de eventos
  async function handleEventDrop({ event, start, end }: any) {
    try {
      await apiClient.patch('/commitments', {
        id: event.id,
        date: start.toISOString().slice(0, 10),
        time: start.toTimeString().slice(0, 5),
      })
      fetchCommitments()
    } catch (err) {
      setError('Erro ao mover compromisso!')
    }
  }

  // Handler para resize de eventos
  async function handleEventResize({ event, start, end }: any) {
    try {
      await apiClient.patch('/commitments', {
        id: event.id,
        date: start.toISOString().slice(0, 10),
        time: start.toTimeString().slice(0, 5),
      })
      fetchCommitments()
    } catch (err) {
      setError('Erro ao redimensionar compromisso!')
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
    setEditingCommitment(null)
    setShowForm(true)
  }

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Você precisa estar autenticado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Compromissos
          </h1>
          <p className="text-slate-600 mt-1">Gerencie seus compromissos e sincronize com Google Calendar</p>
        </div>
        <div className="flex items-center gap-3">
          {hasGoogleIntegration && (
            <>
              <button
                onClick={handleSyncToGoogle}
                disabled={syncing}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                title="Sincronizar para Google Calendar"
              >
                <RiSyncLine className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Sincronizar</span>
              </button>
              <button
                onClick={handleSyncFromGoogle}
                disabled={syncing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                title="Importar do Google Calendar"
              >
                <RiGoogleFill className="w-5 h-5" />
                <span className="hidden md:inline">Importar do Google</span>
              </button>
            </>
          )}
          <button
            onClick={openNewForm}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium flex items-center gap-2"
          >
            <RiAddLine className="w-5 h-5" />
            Novo Compromisso
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar compromissos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <RiFilterLine className="text-slate-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="all">Todos os status</option>
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {/* Calendário */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 mb-6 shadow-sm">
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

      {/* Lista de Compromissos */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <RiCalendarLine className="w-5 h-5 text-cyan-500" />
          Próximos Compromissos
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum compromisso encontrado</h3>
            <p className="text-slate-600 mb-6">Crie seu primeiro compromisso para começar!</p>
            <button
              onClick={openNewForm}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
            >
              Criar Compromisso
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => {
              const commitment = event.resource as Commitment
              const statusConfig = getStatusConfig(commitment.status)
              const isPast = new Date(commitment.date) < new Date()
              
              return (
                <div
                  key={commitment.id}
                  className={`bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group ${
                    commitment.status === 'completed' ? 'opacity-75' : ''
                  } ${isPast && commitment.status === 'scheduled' ? 'border-orange-200 bg-orange-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-semibold text-lg ${commitment.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {commitment.title}
                        </h3>
                        {commitment.googleEventId && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200" title="Sincronizado com Google Calendar">
                            <RiGoogleFill className="w-3 h-3" />
                            Google
                          </span>
                        )}
                      </div>
                      
                      {commitment.description && (
                        <p className="text-slate-600 mb-3 text-sm">{commitment.description}</p>
                      )}
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                          <RiCalendarLine className="w-3 h-3" />
                          {new Date(commitment.date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        {commitment.time && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                            <RiTimeLine className="w-3 h-3" />
                            {commitment.time}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                          <RiUserLine className="w-3 h-3" />
                          {commitment.user.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <button
                        onClick={() => openEditForm(commitment)}
                        className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-transparent hover:border-cyan-200 transition-colors"
                        title="Editar"
                      >
                        <RiEditLine className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(commitment.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 transition-colors"
                        title="Excluir"
                      >
                        <RiDeleteBinLine className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {editingCommitment ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Título *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Digite o título do compromisso"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                  placeholder="Adicione uma descrição (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data *</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hora</label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCommitment(null)
                  setForm({ title: '', description: '', date: '', time: '', status: 'scheduled' })
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
              >
                {editingCommitment ? 'Salvar Alterações' : 'Criar Compromisso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Detalhes do Evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200/60 space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Detalhes do Compromisso
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-800 mb-2">{selectedEvent.title}</h3>
                {selectedEvent.resource.description && (
                  <p className="text-slate-600 text-sm mb-4">{selectedEvent.resource.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <RiCalendarLine className="w-5 h-5 text-cyan-500" />
                  <span>{new Date(selectedEvent.resource.date).toLocaleDateString('pt-BR', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
                {selectedEvent.resource.time && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <RiTimeLine className="w-5 h-5 text-cyan-500" />
                    <span>{selectedEvent.resource.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <RiUserLine className="w-5 h-5 text-cyan-500" />
                  <span>{selectedEvent.resource.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusConfig(selectedEvent.resource.status).color}`}>
                    {getStatusConfig(selectedEvent.resource.status).icon}
                    {getStatusConfig(selectedEvent.resource.status).label}
                  </span>
                  {selectedEvent.resource.googleEventId && (
                    <a
                      href={`https://calendar.google.com/calendar/u/0/r/eventedit/${selectedEvent.resource.googleEventId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                    >
                      <RiGoogleFill className="w-3 h-3" />
                      Abrir no Google
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors font-medium"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  openEditForm(selectedEvent.resource)
                  setSelectedEvent(null)
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-200 transition-colors font-medium flex items-center gap-2"
              >
                <RiEditLine className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedEvent.resource.id)
                }}
                className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors font-medium flex items-center gap-2"
              >
                <RiDeleteBinLine className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
