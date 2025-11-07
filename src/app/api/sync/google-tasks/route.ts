import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/db'
import { googleTasksService } from '@/lib/google-services'
import { requireAuth } from '@/lib/authorization'

export async function POST(request: NextRequest) {
  try {
    const { session, role, familyId, error } = await requireAuth(request, [])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const user = session.user as any
    const userId = user.id

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

    const { action, taskId } = await request.json()

    switch (action) {
      case 'sync_to_google': {
        // Sincronizar tarefas do banco para o Google
        const tasks = await prisma.task.findMany({
          where: {
            familyId,
            googleTaskId: null, // Apenas tarefas não sincronizadas
          },
        })

        const syncResults = []
        for (const task of tasks) {
          try {
            const taskData = {
              title: task.title,
              notes: task.description || '',
              due: task.dueDate.toISOString(),
            }
            const googleTask = await googleTasksService.createTask(
              userId,
              familyId,
              taskData
            )
            // Atualizar tarefa com ID do Google
            await prisma.task.update({
              where: { id: task.id },
              data: { googleTaskId: googleTask.id },
            })
            syncResults.push({
              taskId: task.id,
              googleTaskId: googleTask.id,
              status: 'success',
            })
          } catch (error) {
            syncResults.push({
              taskId: task.id,
              status: 'error',
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            })
          }
        }
        return NextResponse.json({
          message: 'Sincronização concluída',
          results: syncResults,
        })
      }
      case 'sync_from_google': {
        // Sincronizar tarefas do Google para o banco
        const googleTasks = await googleTasksService.listTasks(userId, familyId)
        const importResults = []
        for (const gTask of googleTasks) {
          if (!gTask.id || !gTask.title || !gTask.due) continue
          // Verificar se já existe no banco
          const existing = await prisma.task.findFirst({
            where: {
              familyId,
              googleTaskId: gTask.id,
            },
          })
          if (!existing) {
            try {
              const task = await prisma.task.create({
                data: {
                  title: gTask.title,
                  description: gTask.notes || '',
                  dueDate: new Date(gTask.due),
                  familyId,
                  userId,
                  googleTaskId: gTask.id,
                },
              })
              importResults.push({
                googleTaskId: gTask.id,
                taskId: task.id,
                status: 'imported',
              })
            } catch (error) {
              importResults.push({
                googleTaskId: gTask.id,
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
      }
      case 'update_task': {
        // Atualizar tarefa específica no Google
        if (!taskId) {
          return NextResponse.json(
            { error: 'ID da tarefa é obrigatório' },
            { status: 400 }
          )
        }
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            familyId,
          },
        })
        if (!task) {
          return NextResponse.json(
            { error: 'Tarefa não encontrada' },
            { status: 404 }
          )
        }
        if (!task.googleTaskId) {
          return NextResponse.json(
            { error: 'Tarefa não está sincronizada com Google' },
            { status: 400 }
          )
        }
        const taskData = {
          title: task.title,
          notes: task.description || '',
          due: task.dueDate.toISOString(),
        }
        await googleTasksService.updateTask(
          userId,
          familyId,
          task.googleTaskId,
          taskData
        )
        return NextResponse.json({
          message: 'Tarefa atualizada no Google Tasks',
        })
      }
      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na sincronização Google Tasks:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 