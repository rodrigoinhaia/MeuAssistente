/**
 * Identificação de Usuário e Família
 * Valida se o usuário está cadastrado antes de processar mensagens
 */

import { prisma } from '@/lib/db'

export interface UserIdentification {
  userId: string
  userName: string
  familyId: string
  familyName: string
  phoneNumber: string
  role: string
  isActive: boolean
}

/**
 * Normaliza número de telefone para formato padrão
 * Remove caracteres especiais, @s.whatsapp.net e formata
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove @s.whatsapp.net se presente
  let cleaned = phone.replace(/@s\.whatsapp\.net/gi, '')
  
  // Remove caracteres não numéricos
  let normalized = cleaned.replace(/\D/g, '')

  // Se começar com 55 (Brasil), mantém
  // Se não começar com 55, adiciona
  if (!normalized.startsWith('55')) {
    // Se começar com 0, remove
    if (normalized.startsWith('0')) {
      normalized = '55' + normalized.substring(1)
    } else {
      normalized = '55' + normalized
    }
  }

  return normalized
}

/**
 * Identifica usuário pelo número de telefone
 * Busca primeiro no campo User.phone, depois tenta Family.phoneNumber
 */
export async function identifyUserByPhone(
  phoneNumber: string
): Promise<UserIdentification | null> {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // Tentar diferentes variações do telefone
    const phoneVariations = [
      normalizedPhone,
      normalizedPhone.replace(/^55/, ''), // Sem código do país
      normalizedPhone.replace(/^55/, '0'), // Com zero inicial
      phoneNumber.replace(/\D/g, ''), // Apenas números do original
    ].filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicatas

    // Primeiro, tentar encontrar usuário pelo telefone
    // Buscar com diferentes formatos
    let user = null
    for (const phoneVar of phoneVariations) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneVar },
            { phone: { contains: phoneVar } },
            { phone: { endsWith: phoneVar.slice(-10) } }, // Últimos 10 dígitos
          ],
          isActive: true,
        },
        include: {
          family: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              isActive: true,
            },
          },
        },
      })

      if (user) break
    }

    if (user && user.family && user.family.isActive) {
      return {
        userId: user.id,
        userName: user.name,
        familyId: user.family.id,
        familyName: user.family.name,
        phoneNumber: normalizedPhone,
        role: user.role,
        isActive: user.isActive,
      }
    }

    // Se não encontrou usuário, tentar encontrar família pelo phoneNumber
    let family = null
    for (const phoneVar of phoneVariations) {
      family = await prisma.family.findFirst({
        where: {
          OR: [
            { phoneNumber: phoneVar },
            { phoneNumber: { contains: phoneVar } },
            { phone: { contains: phoneVar } },
            { phoneNumber: { endsWith: phoneVar.slice(-10) } }, // Últimos 10 dígitos
          ],
          isActive: true,
        },
        include: {
          users: {
            where: {
              isActive: true,
            },
          },
        },
      })

      if (family) break
    }

    if (family && family.users.length > 0) {
      // Priorizar OWNER, senão pegar o primeiro usuário ativo
      const ownerUser =
        family.users.find((u) => u.role === 'OWNER') || family.users[0]

      return {
        userId: ownerUser.id,
        userName: ownerUser.name,
        familyId: family.id,
        familyName: family.name,
        phoneNumber: normalizedPhone,
        role: ownerUser.role,
        isActive: ownerUser.isActive,
      }
    }

    // Não encontrou usuário nem família
    return null
  } catch (error) {
    console.error('[USER_IDENTIFICATION] Erro ao identificar usuário:', error)
    return null
  }
}

/**
 * Verifica se o usuário está cadastrado e ativo
 */
export async function isUserRegistered(phoneNumber: string): Promise<boolean> {
  const identification = await identifyUserByPhone(phoneNumber)
  return identification !== null
}

/**
 * Obtém mensagem padrão para usuário não cadastrado
 */
export function getUnregisteredUserMessage(): string {
  return `❌ *Você não está cadastrado no sistema.*

Para usar o MeuAssistente, é necessário que o chefe da sua família te adicione ao sistema.

📋 *O que fazer:*
1. Entre em contato com o chefe da sua família
2. Peça para ele acessar o sistema e adicionar você como membro
3. Após ser adicionado, você poderá usar o assistente normalmente

💡 *Dúvidas?* Entre em contato com o suporte através do sistema web.

_Obrigado pela compreensão!_ 🙏`
}

/**
 * Obtém informações do chefe da família (OWNER)
 */
export async function getFamilyOwnerInfo(
  familyId: string
): Promise<{ name: string; phone: string } | null> {
  try {
    const owner = await prisma.user.findFirst({
      where: {
        familyId,
        role: 'OWNER',
        isActive: true,
      },
      select: {
        name: true,
        phone: true,
      },
    })

    return owner || null
  } catch (error) {
    console.error('[USER_IDENTIFICATION] Erro ao buscar chefe da família:', error)
    return null
  }
}

