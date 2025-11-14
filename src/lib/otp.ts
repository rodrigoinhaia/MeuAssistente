/**
 * Funções utilitárias para gerenciamento de OTP
 */

import { prisma } from '@/lib/db'
import { sendWhatsAppMessage } from './whatsapp/send-message'

/**
 * Gera um código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Cria e envia código OTP para o usuário via WhatsApp
 */
export async function createAndSendOTP(userId: string, phone: string): Promise<string> {
  // Gerar código
  const code = generateOTP()

  // Calcular expiração (10 minutos)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Salvar no banco
  await prisma.oTPVerification.create({
    data: {
      userId,
      code,
      phone,
      expiresAt,
      verified: false,
    },
  })

  // Enviar via WhatsApp
  const message = `🔐 *Código de Verificação MeuAssistente*\n\nSeu código de verificação é: *${code}*\n\nEste código expira em 10 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`
  
  try {
    const sent = await sendWhatsAppMessage({
      phoneNumber: phone,
      message,
    })
    
    if (!sent) {
      throw new Error('Falha ao enviar mensagem via WhatsApp')
    }
    
    console.log(`[OTP] Código gerado e enviado para ${phone}: ${code}`)
  } catch (error: any) {
    console.error(`[OTP] Erro ao enviar código para ${phone}:`, error.message)
    throw new Error(`Não foi possível enviar o código OTP: ${error.message}`)
  }

  return code
}

/**
 * Verifica se o código OTP é válido
 */
export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const otp = await prisma.oTPVerification.findFirst({
    where: {
      userId,
      code,
      verified: false,
      expiresAt: {
        gt: new Date(), // Ainda não expirou
      },
    },
    orderBy: {
      createdAt: 'desc', // Pega o mais recente
    },
  })

  if (!otp) {
    return false
  }

  // Marcar como verificado
  await prisma.oTPVerification.update({
    where: { id: otp.id },
    data: {
      verified: true,
      verifiedAt: new Date(),
    },
  })

  // Marcar usuário como verificado
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  })

  return true
}

/**
 * Limpa códigos OTP expirados e não verificados
 */
export async function cleanupExpiredOTPs() {
  const deleted = await prisma.oTPVerification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
      verified: false,
    },
  })

  console.log(`[OTP_CLEANUP] ${deleted.count} códigos expirados removidos`)
  return deleted.count
}

