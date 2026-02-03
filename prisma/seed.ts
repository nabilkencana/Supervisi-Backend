
import { PrismaClient } from '@prisma/client/extension';
import * as bcrypt from 'bcryptjs';



const prisma = new PrismaClient( );

async function main() {
    // Hash password
    const password = await bcrypt.hash('password123', 10);

    // Create Admin User
    const admin = await prisma.user.create({
        data: {
            email: 'admin@moklet.org',
            name: 'Administrator',
            password,
            role: 'ADMIN',
        },
    });

    // Create Supervisor User
    const supervisor = await prisma.user.create({
        data: {
            email: 'supervisor@moklet.org',
            name: 'John Supervisor',
            password,
            role: 'SUPERVISOR',
        },
    });

    // Create Supervisor Profile
    await prisma.supervisor.create({
        data: {
            userId: supervisor.id,
            nip: '198003012001',
            specialization: 'Mathematics',
        },
    });

    // Create Teacher User
    const teacher = await prisma.user.create({
        data: {
            email: 'teacher@moklet.org',
            name: 'Jane Teacher',
            password,
            role: 'TEACHER',
        },
    });

    // Create Teacher Profile
    await prisma.teacher.create({
        data: {
            userId: teacher.id,
            nip: '198504022005',
            subject: 'Mathematics',
            classroom: '10A',
        },
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });