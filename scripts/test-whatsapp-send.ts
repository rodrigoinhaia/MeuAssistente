/**
 * Script de teste direto para enviar mensagem no WhatsApp
 * Testa o envio sem passar pela API
 */

import { sendWhatsAppMessage } from '../src/lib/whatsapp/send-message'

async function testWhatsAppSend() {
  console.log('🧪 Testando envio de mensagem WhatsApp\n')
  console.log('='.repeat(60))

  // Número de teste (use um número válido)
  const testPhone = process.env.TEST_PHONE || '5551981196315'
  const testMessage = '🧪 *Teste de Envio WhatsApp*\n\nEsta é uma mensagem de teste do MeuAssistente.\n\nSe você recebeu esta mensagem, o sistema está funcionando! ✅'

  console.log('📱 Configuração:')
  console.log(`   Telefone: ${testPhone}`)
  console.log(`   EVOLUTION_API_URL: ${process.env.EVOLUTION_API_URL ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   EVOLUTION_API_KEY: ${process.env.EVOLUTION_API_KEY ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   EVOLUTION_INSTANCE_NAME: ${process.env.EVOLUTION_INSTANCE_NAME ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   N8N_WEBHOOK_URL: ${process.env.N8N_WEBHOOK_URL ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log('')

  try {
    console.log('📤 Enviando mensagem...')
    const startTime = Date.now()
    
    const result = await sendWhatsAppMessage({
      phoneNumber: testPhone,
      message: testMessage,
    })
    
    const duration = Date.now() - startTime
    
    if (result) {
      console.log(`\n✅ Mensagem enviada com sucesso! (${duration}ms)`)
      console.log(`   Telefone: ${testPhone}`)
      console.log(`   Mensagem: ${testMessage.substring(0, 50)}...`)
    } else {
      console.log(`\n❌ Falha ao enviar mensagem (retornou false)`)
      console.log(`   Tempo decorrido: ${duration}ms`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Erro ao enviar mensagem:')
    console.error('   Mensagem:', error.message)
    console.error('   Stack:', error.stack)
    console.error('   Tipo:', error.name)
    console.error('   Código:', error.code)
    
    if (error.response) {
      console.error('\n📡 Detalhes da resposta HTTP:')
      console.error('   Status:', error.response.status)
      console.error('   Status Text:', error.response.statusText)
      console.error('   Data:', JSON.stringify(error.response.data, null, 2))
    }
    
    if (error.request) {
      console.error('\n📡 Detalhes da requisição:')
      console.error('   URL:', error.config?.url)
      console.error('   Method:', error.config?.method)
      console.error('   Headers:', JSON.stringify(error.config?.headers, null, 2))
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

testWhatsAppSend()
  .then(() => {
    console.log('\n✅ Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
