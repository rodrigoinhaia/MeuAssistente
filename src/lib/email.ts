/**
 * Serviço de envio de emails usando Resend
 * Documentação: https://resend.com/docs
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@meuassistente.com'
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'MeuAssistente'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Enviar email usando Resend
 */
export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY não configurada. Email não será enviado.')
    console.log('[EMAIL_SIMULADO]', { to, subject })
    return { success: true, messageId: 'simulated' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao enviar email')
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error: any) {
    console.error('[EMAIL_ERROR]', error)
    return { success: false, error: error.message }
  }
}

/**
 * Template de email: Trial acabando (2 dias antes)
 */
export function getTrialExpiringEmailTemplate(data: {
  userName: string
  planName: string
  daysRemaining: number
  trialEndDate: string
  upgradeUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Acabando - MeuAssistente</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">MeuAssistente</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Olá, ${data.userName}! 👋</h2>
    
    <p style="color: #4b5563;">
      Seu trial do plano <strong>${data.planName}</strong> está acabando!
    </p>
    
    <div style="background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; color: #1f2937;">
        <strong>⏰ ${data.daysRemaining} ${data.daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</strong>
      </p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
        Seu trial expira em: <strong>${data.trialEndDate}</strong>
      </p>
    </div>
    
    <p style="color: #4b5563;">
      Para continuar aproveitando todos os recursos do MeuAssistente, escolha um plano e finalize sua assinatura:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.upgradeUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Escolher Plano e Continuar
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Se você não escolher um plano até o fim do trial, seu acesso será bloqueado temporariamente.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Este é um email automático. Por favor, não responda.
    </p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Template de email: Trial expirado
 */
export function getTrialExpiredEmailTemplate(data: {
  userName: string
  planName: string
  upgradeUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Expirado - MeuAssistente</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">MeuAssistente</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Olá, ${data.userName}! 👋</h2>
    
    <p style="color: #4b5563;">
      Seu trial do plano <strong>${data.planName}</strong> expirou.
    </p>
    
    <div style="background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; color: #1f2937;">
        <strong>🔒 Acesso Temporariamente Bloqueado</strong>
      </p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
        Para continuar usando o sistema, escolha um plano e finalize sua assinatura.
      </p>
    </div>
    
    <p style="color: #4b5563;">
      Não se preocupe! Todos os seus dados estão seguros. Basta escolher um plano para reativar seu acesso imediatamente:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.upgradeUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Escolher Plano Agora
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Se você tiver alguma dúvida, entre em contato conosco pelo suporte.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Este é um email automático. Por favor, não responda.
    </p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Template de email: Pagamento confirmado
 */
export function getPaymentConfirmedEmailTemplate(data: {
  userName: string
  planName: string
  amount: number
  nextBillingDate?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - MeuAssistente</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">MeuAssistente</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Olá, ${data.userName}! 🎉</h2>
    
    <p style="color: #4b5563;">
      Seu pagamento foi confirmado com sucesso!
    </p>
    
    <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 18px; color: #1f2937;">
        <strong>✅ Assinatura Ativa</strong>
      </p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
        Plano: <strong>${data.planName}</strong>
      </p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
        Valor: <strong>R$ ${data.amount.toFixed(2).replace('.', ',')}</strong>
      </p>
      ${data.nextBillingDate ? `
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
        Próxima cobrança: <strong>${data.nextBillingDate}</strong>
      </p>
      ` : ''}
    </div>
    
    <p style="color: #4b5563;">
      Seu acesso está totalmente liberado! Aproveite todos os recursos do MeuAssistente.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Acessar Dashboard
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      Este é um email automático. Por favor, não responda.
    </p>
  </div>
</body>
</html>
  `.trim()
}

