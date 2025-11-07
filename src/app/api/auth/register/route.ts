"use client";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      cpf,
      phoneNumber,
      address,
      familyName,
    } = await req.json()

    if (!name || !email || !password || !cpf || !phoneNumber || !address || !familyName) {
      return NextResponse.json({ status: 'error', message: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 })
    }

    // Função utilitária para validar CPF
    function isValidCPF(cpf: string): boolean {
      cpf = cpf.replace(/\D/g, '')
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
      let sum = 0, rest
      for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
      rest = (sum * 10) % 11
      if (rest === 10 || rest === 11) rest = 0
      if (rest !== parseInt(cpf.substring(9, 10))) return false
      sum = 0
      for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
      rest = (sum * 10) % 11
      if (rest === 10 || rest === 11) rest = 0
      if (rest !== parseInt(cpf.substring(10, 11))) return false
      return true
    }

    if (!isValidCPF(cpf)) {
      return NextResponse.json({ status: 'error', message: 'CPF inválido.' }, { status: 400 })
    }

    // Verifica se já existe usuário
    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: 'E-mail já cadastrado.' }, { status: 400 })
    }

    // Cria família se necessário (busca por telefone)
    let family = await prisma.family.findUnique({ where: { phoneNumber } })
    if (!family) {
      family = await prisma.family.create({
        data: {
          name: familyName,
          phone: phoneNumber,
          phoneNumber,
        },
      })
    }

    // Cria usuário OWNER
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phone: phoneNumber,
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        role: 'OWNER',
        familyId: family.id,
      },
    })

    return NextResponse.json({ status: 'ok', message: 'Usuário registrado com sucesso!', user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Erro ao registrar usuário', error: String(error) }, { status: 500 })
  }
} 