
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true, role: true }
    });
    console.log('--- ADMIN USERS ---');
    console.log(admins);
    await prisma.$disconnect();
}

main();
