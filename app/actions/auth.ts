'use server';

import * as z from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
});

export async function registerAction(data: z.infer<typeof RegisterSchema>) {
    const validated = RegisterSchema.safeParse(data);

    if (!validated.success) {
        return { error: 'Invalid fields' };
    }

    const { email, password, name } = validated.data;

    // Check existing
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: 'Email already in use!' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: 'CITIZEN',
        },
    });

    // Auto sign-in after registration and redirect to dashboard
    try {
        await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: 'Account created but auto-login failed. Please sign in manually.' };
        }
        throw error; // Re-throw NEXT_REDIRECT
    }
}

