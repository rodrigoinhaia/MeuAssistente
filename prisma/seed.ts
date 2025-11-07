import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Limpa os dados existentes para evitar duplicatas
  await prisma.user.deleteMany()
  await prisma.family.deleteMany()

  // 1. Criar Família e Usuário SUPER_ADMIN
  const superAdminFamily = await prisma.family.create({
    data: {
      name: 'Plataforma MeuAssistente',
      phoneNumber: '00000000000',
      phone: '00000000000',
      subscriptionPlan: 'enterprise',
      isActive: true,
    },
  })

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@meuassistente.com',
      password: await bcrypt.hash('superadmin123', 10),
      cpf: '00000000000',
      phone: '00000000000',
      role: UserRole.SUPER_ADMIN,
      familyId: superAdminFamily.id,
    },
  })
  console.log(`Created SUPER_ADMIN user: ${superAdmin.email}`)

  // 2. Criar Família e Usuário OWNER (Cliente)
  const ownerFamily = await prisma.family.create({
    data: {
      name: 'Família Silva',
      phoneNumber: '11987654321',
      phone: '11987654321',
      subscriptionPlan: 'premium',
      isActive: true,
    },
  })

  const owner = await prisma.user.create({
    data: {
      name: 'Admin Master',
      email: 'admin@teste.com',
      password: await bcrypt.hash('admin123', 10),
      cpf: '11122233344',
      phone: '11987654321',
      role: UserRole.OWNER,
      familyId: ownerFamily.id,
    },
  })
  console.log(`Created OWNER user: ${owner.email}`)

  // 3. Criar um usuário ADMIN para a família do OWNER
  const adminUser = await prisma.user.create({
    data: {
      name: 'Esposa Admin',
      email: 'esposa@teste.com',
      password: await bcrypt.hash('esposa123', 10),
      cpf: '22233344455',
      phone: '11987654322',
      role: UserRole.ADMIN,
      familyId: ownerFamily.id,
    },
  })
  console.log(`Created ADMIN user: ${adminUser.email}`)

  // 4. Criar um usuário USER comum para a família do OWNER
  const commonUser = await prisma.user.create({
    data: {
      name: 'Filho User',
      email: 'filho@teste.com',
      password: await bcrypt.hash('filho123', 10),
      cpf: '33344455566',
      phone: '11987654323',
      role: UserRole.USER,
      familyId: ownerFamily.id,
    },
  })
  console.log(`Created USER user: ${commonUser.email}`)

  console.log('Seeding finished.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() }) 