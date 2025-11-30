import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const userId = '49f75344-3c70-47ed-94a8-3a7f10e6cb73'
    const newPassword = 'Admin123@2025'

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        })

        console.log(`Password updated successfully for user: ${user.email}`)
        console.log(`New password: ${newPassword}`)
    } catch (error) {
        console.error('Error updating password:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
