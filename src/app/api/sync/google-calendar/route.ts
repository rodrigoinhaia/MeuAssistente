import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { googleCalendarService } from '@/lib/google-services'
import { requireAuth } from '@/lib/authorization'

export async function POST(request: NextRequest) {
  try {
    const { session, role, familyId, error } = await requireAuth(request, [])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    
    if (!familyId) {
      return NextResponse.json({ error: 'FamilyId é obrigatório' }, { status: 400 })
    }
    
    const user = session.user as any
    const userId = user.id

    const { action, commitmentId } = await request.json()

    // Verificar se tem integração Google ativa
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        familyId,
        provider: 'google',
        isActive: true,
      },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integração Google não configurada' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'sync_to_google':
        // Sincronizar compromissos do banco para o Google
        const commitments = await prisma.commitment.findMany({
          where: {
            familyId,
            googleEventId: null, // Apenas compromissos não sincronizados
          },
        })

        const syncResults = []
        for (const commitment of commitments) {
          try {
            // Calcular data/hora de início e fim baseado no campo 'date' e 'time'
            const startDateTime = new Date(commitment.date)
            if (commitment.time) {
              const [hours, minutes] = commitment.time.split(':')
              startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
            }
            
            const endDateTime = new Date(startDateTime)
            endDateTime.setHours(endDateTime.getHours() + 1) // Duração padrão de 1 hora

            const eventData = {
              summary: commitment.title,
              description: commitment.description || '',
              start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'America/Sao_Paulo',
              },
              end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'America/Sao_Paulo',
              },
            }

            const googleEvent = await googleCalendarService.createEvent(
              userId,
              familyId,
              eventData
            )

            // Atualizar compromisso com ID do evento Google
            await prisma.commitment.update({
              where: { id: commitment.id },
              data: { googleEventId: googleEvent.id },
            })

            syncResults.push({
              commitmentId: commitment.id,
              googleEventId: googleEvent.id,
              status: 'success',
            })
          } catch (error) {
            syncResults.push({
              commitmentId: commitment.id,
              status: 'error',
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            })
          }
        }

        return NextResponse.json({
          message: 'Sincronização concluída',
          results: syncResults,
        })

      case 'sync_from_google':
        // Sincronizar eventos do Google para o banco
        const timeMin = new Date()
        const timeMax = new Date()
        timeMax.setMonth(timeMax.getMonth() + 1) // Próximo mês

        const googleEvents = await googleCalendarService.listEvents(
          userId,
          familyId,
          timeMin.toISOString(),
          timeMax.toISOString()
        )

        const importResults = []
        for (const event of googleEvents) {
          if (!event.id || !event.start?.dateTime) continue

          // Verificar se já existe no banco
          const existing = await prisma.commitment.findFirst({
            where: {
              familyId,
              googleEventId: event.id,
            },
          })

          if (!existing) {
            try {
              const startDate = new Date(event.start.dateTime!)
              const endDate = new Date(event.end?.dateTime || event.start.dateTime!)
              
              // Extrair hora do evento
              const time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`

              const commitment = await prisma.commitment.create({
                data: {
                  title: event.summary || 'Evento sem título',
                  description: event.description || '',
                  date: startDate,
                  time: time,
                  familyId,
                  userId: userId,
                  googleEventId: event.id,
                },
              })

              importResults.push({
                googleEventId: event.id,
                commitmentId: commitment.id,
                status: 'imported',
              })
            } catch (error) {
              importResults.push({
                googleEventId: event.id,
                status: 'error',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
              })
            }
          }
        }

        return NextResponse.json({
          message: 'Importação concluída',
          results: importResults,
        })

      case 'update_commitment':
        // Atualizar compromisso específico no Google
        if (!commitmentId) {
          return NextResponse.json(
            { error: 'ID do compromisso é obrigatório' },
            { status: 400 }
          )
        }

        const commitment = await prisma.commitment.findFirst({
          where: {
            id: commitmentId,
            familyId,
          },
        })

        if (!commitment) {
          return NextResponse.json(
            { error: 'Compromisso não encontrado' },
            { status: 404 }
          )
        }

        if (!commitment.googleEventId) {
          return NextResponse.json(
            { error: 'Compromisso não está sincronizado com Google' },
            { status: 400 }
          )
        }

        // Calcular data/hora de início e fim
        const startDateTime = new Date(commitment.date)
        if (commitment.time) {
          const [hours, minutes] = commitment.time.split(':')
          startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        }
        
        const endDateTime = new Date(startDateTime)
        endDateTime.setHours(endDateTime.getHours() + 1)

        const eventData = {
          summary: commitment.title,
          description: commitment.description || '',
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
        }

        await googleCalendarService.updateEvent(
          userId,
          familyId,
          commitment.googleEventId,
          eventData
        )

        return NextResponse.json({
          message: 'Compromisso atualizado no Google Calendar',
        })

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na sincronização Google Calendar:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 