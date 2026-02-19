import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
    // @ts-expect-error - Known type mismatch with v5 beta adapter
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    ...authConfig,
    pages: {
        signIn: '/auth/signin',
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                console.log("[Auth] Authorize called. Credential keys:", Object.keys(credentials));

                // 1. Check for Firebase ID Token (Google Auth via Firebase)
                const firebaseTokenSchema = z.object({ idToken: z.string() });
                const parsedToken = firebaseTokenSchema.safeParse(credentials);

                if (parsedToken.success) {
                    console.log("[Auth] Firebase ID Token detected. Verifying...");
                    const { idToken } = parsedToken.data;
                    try {
                        // Verify token via Google's public endpoint (No Service Account needed)
                        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(`[Auth] Google Token Validation Failed: ${response.status} - ${errorText}`);
                            return null;
                        }

                        const data = await response.json();
                        // console.log("[Auth] Token verified. Data:", JSON.stringify(data, null, 2)); // Careful with PII logs in prod

                        const { email, name, picture, sub } = data;
                        console.log(`[Auth] Google Data - Email: ${email}, Name: ${name}`);

                        if (!email) {
                            console.error("[Auth] No email found in token data.");
                            return null;
                        }

                        console.log(`[Auth] Token valid for email: ${email}`);

                        // Upsert User
                        let user = await prisma.user.findUnique({ where: { email } });

                        if (!user) {
                            console.log(`[Auth] User not found. Creating new user for ${email}...`);
                            // Create new user
                            try {
                                user = await prisma.user.create({
                                    data: {
                                        email,
                                        name: name || email.split('@')[0],
                                        image: picture,
                                        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                                        role: 'CITIZEN',
                                    }
                                });
                                console.log(`[Auth] User created successfully: ${user.id}`);
                            } catch (dbError) {
                                console.error("[Auth] Database Create Error:", dbError);
                                return null;
                            }
                        } else {
                            console.log(`[Auth] User found: ${user.id}. Syncing profile...`);

                            const dataToUpdate: any = {};
                            // Always update image if we have one from Google
                            if (picture && user.image !== picture) {
                                dataToUpdate.image = picture;
                                user.image = picture; // Update in memory too!
                            }
                            // Update name if it's default or different
                            if (name && (user.name === 'Citizen' || user.name !== name)) {
                                dataToUpdate.name = name;
                                user.name = name; // Update in memory too!
                            }

                            if (Object.keys(dataToUpdate).length > 0) {
                                try {
                                    await prisma.user.update({
                                        where: { email },
                                        data: dataToUpdate
                                    });
                                    console.log("[Auth] User profile synced with Google.");
                                } catch (updateError) {
                                    console.error("[Auth] Database Update Error:", updateError);
                                }
                            }
                        }

                        return user;
                    } catch (error) {
                        console.error("[Auth] Firebase Verification Exception:", error);
                        return null;
                    }
                } else {
                    console.log("[Auth] Parsing for ID Token failed:", parsedToken.error.flatten().fieldErrors);
                }

                // 2. Fallback to Standard Email/Password
                console.log("[Auth] Attempting standard Credentials login...");
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await prisma.user.findUnique({ where: { email } });

                    if (!user) {
                        console.log("[Auth] User not found during standard login.");
                        return null;
                    }
                    if (!user.password) {
                        console.log("[Auth] User has no password set (OAuth user?).");
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        console.log("[Auth] Credentials match. Logging in.");
                        return user;
                    } else {
                        console.log("[Auth] Password mismatch.");
                    }
                } else {
                    console.log("[Auth] Invalid credential format:", parsedCredentials.error.flatten().fieldErrors);
                }

                console.log("[Auth] Returning null (Unauthorized).");
                return null;
            },
        }),
    ],
    // callbacks are now in auth.config.ts
})
