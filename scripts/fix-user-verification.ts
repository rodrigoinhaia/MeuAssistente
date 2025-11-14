/**
 * Script para corrigir status de verificação de usuários
 * Marca como não verificado se nunca verificou via OTP
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserVerification() {
  console.log('🔧 Corrigindo status de verificação de usuários\n')
  console.log('='.repeat(60))

  try {
    // Buscar todos os usuários marcados como verificados
    const verifiedUsers = await prisma.user.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isVerified: true,
        otpVerifications: {
          where: { verified: true },
          take: 1,
          select: { id: true, verifiedAt: true },
        },
      },
    })

    console.log(`\n📊 Encontrados ${verifiedUsers.length} usuários marcados como verificados\n`)

    let fixed = 0
    let alreadyVerified = 0

    for (const user of verifiedUsers) {
      // Verificar se realmente tem uma verificação OTP confirmada
      const hasVerifiedOTP = user.otpVerifications.length > 0

      if (!hasVerifiedOTP) {
        console.log(`❌ ${user.email} - Marcado como verificado mas nunca verificou via OTP`)
        console.log(`   Corrigindo para isVerified = false...`)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: false },
        })
        
        fixed++
        console.log(`   ✅ Corrigido!\n`)
      } else {
        console.log(`✅ ${user.email} - Realmente verificou via OTP`)
        console.log(`   Verificado em: ${user.otpVerifications[0].verifiedAt?.toLocaleString('pt-BR')}\n`)
        alreadyVerified++
      }
    }

    console.log('='.repeat(60))
    console.log('\n📊 Resumo:')
    console.log(`   Total de usuários verificados: ${verifiedUsers.length}`)
    console.log(`   ✅ Realmente verificados: ${alreadyVerified}`)
    console.log(`   🔧 Corrigidos (marcados como não verificados): ${fixed}`)

    // Estatísticas finais
    const totalUsers = await prisma.user.count()
    const verifiedCount = await prisma.user.count({ where: { isVerified: true } })
    const unverifiedCount = await prisma.user.count({ where: { isVerified: false } })

    console.log('\n📊 Estatísticas Finais:')
    console.log(`   Total de usuários: ${totalUsers}`)
    console.log(`   Verificados: ${verifiedCount}`)
    console.log(`   Não verificados: ${unverifiedCount}`)

    console.log('\n✅ Correção concluída!')
    console.log('\n💡 Próximos passos:')
    console.log('   1. Usuários corrigidos verão o banner de verificação no dashboard')
    console.log('   2. Eles precisarão verificar via OTP para acessar funcionalidades completas')
    console.log('   3. Após verificar, o status será atualizado automaticamente')

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixUserVerification()
  .then(() => {
    console.log('\n✅ Processo concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

