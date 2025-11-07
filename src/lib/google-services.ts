import { google } from 'googleapis'
import { prisma } from './db'

// Configuração OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/auth/google/callback'
)

// Buscar tokens do usuário
async function getUserTokens(userId: string, familyId: string) {
  const integration = await prisma.integration.findFirst({
    where: {
      userId,
      familyId,
      provider: 'google',
      isActive: true,
    },
  })

  if (!integration) {
    throw new Error('Integração Google não encontrada')
  }

  // Verificar se o token expirou
  if (integration.expiresAt && new Date() > integration.expiresAt) {
    // Renovar token (implementar lógica de refresh)
    throw new Error('Token expirado - necessário renovar')
  }

  return {
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
  }
}

// Configurar cliente OAuth com tokens
async function getGoogleClient(userId: string, familyId: string) {
  const tokens = await getUserTokens(userId, familyId)
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  })
  return oauth2Client
}

// Google Calendar Services
export const googleCalendarService = {
  // Listar eventos
  async listEvents(userId: string, familyId: string, timeMin?: string, timeMax?: string) {
    const auth = await getGoogleClient(userId, familyId)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  },

  // Criar evento
  async createEvent(userId: string, familyId: string, eventData: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
  }) {
    const auth = await getGoogleClient(userId, familyId)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
    })

    return response.data
  },

  // Atualizar evento
  async updateEvent(userId: string, familyId: string, eventId: string, eventData: any) {
    const auth = await getGoogleClient(userId, familyId)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: eventData,
    })

    return response.data
  },

  // Deletar evento
  async deleteEvent(userId: string, familyId: string, eventId: string) {
    const auth = await getGoogleClient(userId, familyId)
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })
  },
}

// Google Tasks Services
export const googleTasksService = {
  // Listar tarefas
  async listTasks(userId: string, familyId: string, tasklistId: string = '@default') {
    const auth = await getGoogleClient(userId, familyId)
    const tasks = google.tasks({ version: 'v1', auth })

    const response = await tasks.tasks.list({
      tasklist: tasklistId,
      showCompleted: false,
      maxResults: 100,
    })

    return response.data.items || []
  },

  // Criar tarefa
  async createTask(userId: string, familyId: string, taskData: {
    title: string
    notes?: string
    due?: string
  }, tasklistId: string = '@default') {
    const auth = await getGoogleClient(userId, familyId)
    const tasks = google.tasks({ version: 'v1', auth })

    const response = await tasks.tasks.insert({
      tasklist: tasklistId,
      requestBody: taskData,
    })

    return response.data
  },

  // Atualizar tarefa
  async updateTask(userId: string, familyId: string, taskId: string, taskData: any, tasklistId: string = '@default') {
    const auth = await getGoogleClient(userId, familyId)
    const tasks = google.tasks({ version: 'v1', auth })

    const response = await tasks.tasks.update({
      tasklist: tasklistId,
      task: taskId,
      requestBody: taskData,
    })

    return response.data
  },

  // Deletar tarefa
  async deleteTask(userId: string, familyId: string, taskId: string, tasklistId: string = '@default') {
    const auth = await getGoogleClient(userId, familyId)
    const tasks = google.tasks({ version: 'v1', auth })

    await tasks.tasks.delete({
      tasklist: tasklistId,
      task: taskId,
    })
  },
} 