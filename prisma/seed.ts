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
      isActive: true, // Garantir que está ativo
      isVerified: true, // Usuários de seed já estão verificados
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
      isActive: true, // Garantir que está ativo
      isVerified: true, // Usuários de seed já estão verificados
    },
  })
  console.log(`Created OWNER user: ${owner.email}`)

  // 3. Criar um usuário USER comum para a família do OWNER
  const commonUser = await prisma.user.create({
    data: {
      name: 'Filho User',
      email: 'filho@teste.com',
      password: await bcrypt.hash('filho123', 10),
      cpf: '33344455566',
      phone: '11987654323',
      role: UserRole.USER,
      familyId: ownerFamily.id,
      isActive: true, // Garantir que está ativo
      isVerified: true, // Usuários de seed já estão verificados
    },
  })
  console.log(`Created USER user: ${commonUser.email}`)

  // 3.5. Criar categorias padrão para a família do OWNER
  const defaultExpenseCategories = [
    { name: 'Alimentação', color: '#EF4444', icon: '🍔' },
    { name: 'Transporte', color: '#3B82F6', icon: '🚗' },
    { name: 'Moradia', color: '#8B5CF6', icon: '🏠' },
    { name: 'Saúde', color: '#10B981', icon: '🏥' },
    { name: 'Educação', color: '#F59E0B', icon: '📚' },
    { name: 'Lazer', color: '#EC4899', icon: '🎬' },
    { name: 'Roupas', color: '#6366F1', icon: '👕' },
    { name: 'Contas', color: '#14B8A6', icon: '💡' },
    { name: 'Compras', color: '#F97316', icon: '🛒' },
    { name: 'Outros', color: '#6B7280', icon: '📦' },
  ]

  const defaultIncomeCategories = [
    { name: 'Salário', color: '#10B981', icon: '💰' },
    { name: 'Freelance', color: '#3B82F6', icon: '💼' },
    { name: 'Investimentos', color: '#8B5CF6', icon: '📈' },
    { name: 'Vendas', color: '#F59E0B', icon: '🛍️' },
    { name: 'Presentes', color: '#EC4899', icon: '🎁' },
    { name: 'Outros', color: '#6B7280', icon: '📦' },
  ]

  for (const category of defaultExpenseCategories) {
    await prisma.category.create({
      data: {
        familyId: ownerFamily.id,
        name: category.name,
        type: 'expense',
        color: category.color,
        icon: category.icon,
        isActive: true,
      },
    })
  }
  console.log(`Created ${defaultExpenseCategories.length} expense categories`)

  for (const category of defaultIncomeCategories) {
    await prisma.category.create({
      data: {
        familyId: ownerFamily.id,
        name: category.name,
        type: 'income',
        color: category.color,
        icon: category.icon,
        isActive: true,
      },
    })
  }
  console.log(`Created ${defaultIncomeCategories.length} income categories`)

  // 4. Criar Planos
  await prisma.plan.deleteMany() // Limpa planos existentes

  const basicPlan = await prisma.plan.create({
    data: {
      name: 'Básico',
      description: 'Plano ideal para começar a organizar suas finanças familiares',
      price: 19.90,
      features: [
        'Até 5 membros da família',
        'Controle de receitas e despesas',
        'Categorização automática',
        'Relatórios básicos',
        'Importação de extratos (OFX/CSV)',
        'Suporte por email',
        '3 dias grátis para testar',
      ],
      maxUsers: 5,
      maxStorage: 1,
      isActive: true,
    },
  })
  console.log(`Created plan: ${basicPlan.name} - R$ ${basicPlan.price}`)

  const premiumPlan = await prisma.plan.create({
    data: {
      name: 'Premium',
      description: 'Plano completo com recursos avançados para famílias maiores',
      price: 29.90,
      features: [
        'Até 15 membros da família',
        'Tudo do plano Básico',
        'Integração com Google Calendar',
        'Integração com N8N',
        'Categorização por IA avançada',
        'Relatórios detalhados',
        'Suporte prioritário',
        '5GB de armazenamento',
        '3 dias grátis para testar',
      ],
      maxUsers: 15,
      maxStorage: 5,
      isActive: true,
    },
  })
  console.log(`Created plan: ${premiumPlan.name} - R$ ${premiumPlan.price}`)

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'Plano empresarial com recursos ilimitados e suporte dedicado',
      price: 99.90,
      features: [
        'Membros ilimitados',
        'Tudo do plano Premium',
        'API personalizada',
        'Integrações avançadas',
        'Suporte 24/7',
        'Armazenamento ilimitado',
        'Relatórios customizados',
        'Treinamento da equipe',
        '3 dias grátis para testar',
      ],
      maxUsers: 999,
      maxStorage: 999,
      isActive: true,
    },
  })
  console.log(`Created plan: ${enterprisePlan.name} - R$ ${enterprisePlan.price}`)

  console.log('Seeding finished.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() }) 