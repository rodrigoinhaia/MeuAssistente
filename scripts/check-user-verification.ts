/**
 * Script para verificar status de verificação de um usuário
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserVerification() {
  const email = 'vanessaev1986@gmail.com'
  
  console.log(`🔍 Verificando status de verificação do usuário: ${email}\n`)
  console.log('='.repeat(60))

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isVerified: true,
        isActive: true,
        role: true,
        otpVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            code: true,
            phone: true,
            verified: true,
            expiresAt: true,
            createdAt: true,
            verifiedAt: true,
          },
        },
      },
    })

    if (!user) {
      console.error(`❌ Usuário não encontrado: ${email}`)
      await prisma.$disconnect()
      process.exit(1)
    }

    console.log('\n👤 Dados do Usuário:')
    console.log('─'.repeat(60))
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Telefone: ${user.phone || 'Não cadastrado'}`)
    console.log(`   Status: ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Verificado: ${user.isVerified ? '✅ SIM' : '❌ NÃO'}`)
    console.log('─'.repeat(60))

    console.log('\n📋 Histórico de Códigos OTP (últimos 5):')
    if (user.otpVerifications.length === 0) {
      console.log('   Nenhum código OTP encontrado')
    } else {
      user.otpVerifications.forEach((otp, index) => {
        console.log(`\n   ${index + 1}. Código: ${otp.code}`)
        console.log(`      Telefone: ${otp.phone}`)
        console.log(`      Verificado: ${otp.verified ? '✅ Sim' : '❌ Não'}`)
        console.log(`      Criado em: ${otp.createdAt.toLocaleString('pt-BR')}`)
        console.log(`      Expira em: ${otp.expiresAt.toLocaleString('pt-BR')}`)
        if (otp.verifiedAt) {
          console.log(`      Verificado em: ${otp.verifiedAt.toLocaleString('pt-BR')}`)
        }
        const now = new Date()
        const isExpired = otp.expiresAt < now
        console.log(`      Status: ${isExpired ? '⏰ Expirado' : '⏳ Válido'}`)
      })
    }

    console.log('\n🔍 Análise:')
    console.log('─'.repeat(60))
    if (user.isVerified) {
      console.log('   ✅ Usuário está marcado como VERIFICADO no banco')
      console.log('   ⚠️  Por isso o banner de verificação não aparece')
    } else {
      console.log('   ❌ Usuário está marcado como NÃO VERIFICADO no banco')
      console.log('   ✅ O banner de verificação DEVERIA aparecer')
      
      if (!user.phone || user.phone === '00000000000') {
        console.log('   ⚠️  Mas o telefone não está cadastrado!')
      }
    }

    console.log('\n💡 Para forçar exibição do banner:')
    console.log('   1. Atualize o usuário para isVerified = false')
    console.log('   2. Certifique-se de que o telefone está cadastrado')
    console.log('   3. Recarregue a página do dashboard')

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserVerification()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

