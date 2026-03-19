
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@civiccore.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: {
            email,
            name: 'Municipal Admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    console.log(`Admin user ${user.email} updated/created with password: ${password}`);
    await prisma.$disconnect();
}

main().catch(console.error);
