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
  // Validar formato do telefone
  const phoneDigits = phone.replace(/\D/g, '')
  if (phoneDigits.length < 10) {
    throw new Error(`Telefone inválido: ${phone} (${phoneDigits.length} dígitos)`)
  }

  console.log(`[OTP] Criando código OTP para usuário ${userId}, telefone: ${phone} (${phoneDigits.length} dígitos)`)

  // Gerar código
  const code = generateOTP()

  // Calcular expiração (10 minutos)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Salvar no banco
  try {
    await prisma.oTPVerification.create({
      data: {
        userId,
        code,
        phone,
        expiresAt,
        verified: false,
      },
    })
    console.log(`[OTP] Código ${code} salvo no banco para ${phone}`)
  } catch (dbError: any) {
    console.error(`[OTP] Erro ao salvar código no banco:`, dbError)
    throw new Error(`Erro ao salvar código OTP: ${dbError.message}`)
  }

  // Enviar via WhatsApp
  const message = `🔐 *Código de Verificação MeuAssistente*\n\nSeu código de verificação é: *${code}*\n\nEste código expira em 10 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`
  
  try {
    console.log(`[OTP] Tentando enviar mensagem para ${phone}...`)
    const sent = await sendWhatsAppMessage({
      phoneNumber: phone,
      message,
    })
    
    if (!sent) {
      throw new Error('Falha ao enviar mensagem via WhatsApp (retornou false)')
    }
    
    console.log(`[OTP] ✅ Código ${code} gerado e enviado para ${phone}`)
  } catch (error: any) {
    console.error(`[OTP] ❌ Erro ao enviar código para ${phone}:`, {
      message: error.message,
      stack: error.stack,
      phone,
      phoneDigits: phoneDigits.length,
    })
    
    // Não remover o código do banco - usuário pode tentar verificar mesmo se o envio falhou
    // O código ainda é válido por 10 minutos
    
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

