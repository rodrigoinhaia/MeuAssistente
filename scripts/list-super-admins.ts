import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    try {
        const superAdmins = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        console.log('Super Admins found:', superAdmins.length)
        fs.writeFileSync('super-admins.json', JSON.stringify(superAdmins, null, 2))
        console.log('Written to super-admins.json')
    } catch (error) {
        console.error('Error querying users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
