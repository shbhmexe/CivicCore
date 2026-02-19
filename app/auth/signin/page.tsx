import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/google-signin';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function SignInPage(props: { searchParams: Promise<{ callbackUrl?: string, error?: string, success?: string }> }) {
    const searchParams = await props.searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="glass-card w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-center text-gray-400">Sign in to CivicCore</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {searchParams.success && (
                        <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
                            Account created! Please sign in.
                        </div>
                    )}
                    {searchParams.error && (
                        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                            {searchParams.error === 'CredentialsSignin' ? 'Invalid email or password' : 'Authentication failed'}
                        </div>
                    )}

                    <form
                        action={async (formData) => {
                            "use server"
                            const url = await props.searchParams;
                            const callbackUrl = url.callbackUrl || "/dashboard";
                            try {
                                await signIn("credentials", formData, callbackUrl)
                            } catch (error) {
                                if (error instanceof AuthError) {
                                    switch (error.type) {
                                        case 'CredentialsSignin':
                                            redirect(`/auth/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`)
                                        default:
                                            redirect(`/auth/signin?error=Default&callbackUrl=${encodeURIComponent(callbackUrl)}`)
                                    }
                                }
                                throw error
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="m@example.com" className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Sign In with Email
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/50 px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <GoogleSignInButton />
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="/auth/signup" className="text-blue-400 hover:underline">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
