'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';

export default function SignUpPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const onSubmit = (formData: FormData) => {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        setError(null);

        startTransition(async () => {
            const result = await registerAction({ email, password, name });
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="glass-card w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-white">Create Account</CardTitle>
                    <CardDescription className="text-center text-gray-400">Join CivicCore today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form action={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" type="text" required placeholder="John Doe" className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                            {isPending ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/auth/signin" className="text-blue-400 hover:underline">Sign in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
