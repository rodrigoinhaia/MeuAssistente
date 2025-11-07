import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultPlans = [
  {
    name: 'Básico',
    description: 'Ideal para pequenas empresas e usuários individuais',
    price: 29.90,
    features: [
      'Até 5 usuários',
      'Gestão financeira básica',
      'Integração com WhatsApp',
      'Suporte por email',
    ],
    maxUsers: 5,
    maxStorage: 1,
  },
  {
    name: 'Premium',
    description: 'Perfeito para empresas em crescimento',
    price: 59.90,
    features: [
      'Até 20 usuários',
      'Gestão financeira avançada',
      'Integração com Google Calendar e Tasks',
      'Relatórios detalhados',
      'Suporte prioritário',
    ],
    maxUsers: 20,
    maxStorage: 10,
  },
  {
    name: 'Enterprise',
    description: 'Solução completa para grandes empresas',
    price: 99.90,
    features: [
      'Usuários ilimitados',
      'Todas as funcionalidades',
      'Integrações avançadas',
      'Relatórios personalizados',
      'Suporte 24/7',
      'API dedicada',
    ],
    maxUsers: 999,
    maxStorage: 100,
  },
]

async function seedPlans() {
  console.log('Seeding plans...')
  for (const plan of defaultPlans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: plan.name }
    })

    if (!existingPlan) {
      await prisma.plan.create({
        data: plan
      })
      console.log(`✅ Created plan: ${plan.name}`)
    } else {
      // Atualiza o plano existente
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          description: plan.description,
          price: plan.price,
          features: plan.features,
          maxUsers: plan.maxUsers,
          maxStorage: plan.maxStorage,
        }
      })
      console.log(`📝 Updated plan: ${plan.name}`)
    }
  }
  console.log('Plans seeding finished')
}

seedPlans()
  .catch(e => {
    console.error('Error seeding plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
