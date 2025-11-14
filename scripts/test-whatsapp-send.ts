/**
 * Script de teste para envio de mensagem via WhatsApp
 * Uso: npx tsx scripts/test-whatsapp-send.ts
 */

import { sendWhatsAppMessage } from '../src/lib/whatsapp/send-message'

async function testWhatsAppSend() {
  console.log('🧪 Testando envio de mensagem via WhatsApp...\n')

  // Verificar variáveis de ambiente
  const evolutionApiUrl = process.env.EVOLUTION_API_URL
  const evolutionApiKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME

  console.log('📋 Configuração:')
  console.log(`   EVOLUTION_API_URL: ${evolutionApiUrl ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   EVOLUTION_API_KEY: ${evolutionApiKey ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   EVOLUTION_INSTANCE_NAME: ${evolutionInstance ? '✅ Configurado' : '❌ Não configurado'}\n`)

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas!')
    console.log('\n📝 Configure as seguintes variáveis no arquivo .env:')
    console.log('   EVOLUTION_API_URL=https://sua-api-evolution.com')
    console.log('   EVOLUTION_API_KEY=sua-chave-api')
    console.log('   EVOLUTION_INSTANCE_NAME=nome-da-instancia')
    process.exit(1)
  }

  // Número de teste
  const testPhone = '51920014708'
  const testMessage = `🧪 *Teste MeuAssistente*\n\nEsta é uma mensagem de teste enviada em ${new Date().toLocaleString('pt-BR')}.\n\nSe você recebeu esta mensagem, o sistema está funcionando corretamente! ✅`

  console.log('📤 Enviando mensagem de teste...')
  console.log(`   Para: ${testPhone}`)
  console.log(`   Mensagem: ${testMessage.substring(0, 50)}...\n`)

  try {
    const result = await sendWhatsAppMessage({
      phoneNumber: testPhone,
      message: testMessage,
    })

    if (result) {
      console.log('✅ Mensagem enviada com sucesso!')
      console.log('\n📱 Verifique o WhatsApp do número:', testPhone)
    } else {
      console.error('❌ Falha ao enviar mensagem')
      console.log('\n🔍 Possíveis causas:')
      console.log('   1. Instância do Evolution API não está conectada')
      console.log('   2. Número não está registrado na instância')
      console.log('   3. Erro na configuração da API')
      console.log('   4. Verifique os logs do Evolution API')
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error.message)
    console.error('\n📋 Detalhes do erro:')
    console.error(error)
  }
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

