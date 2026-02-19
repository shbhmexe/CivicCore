import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/auth/signin',
    },
    providers: [
        // Added later in auth.ts to avoid edge issues with some providers if needed
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.image = user.image;
                token.name = user.name;
            }
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.name) token.name = session.user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "CITIZEN" | "ADMIN";
                session.user.image = token.image as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnReport = nextUrl.pathname.startsWith('/report');
            const isOnComplaints = nextUrl.pathname.startsWith('/complaints');
            const isOnAuth = nextUrl.pathname.startsWith('/auth');

            // 1. If user is logged in and trying to access sign-in page, redirect to their dashboard
            if (isOnAuth && isLoggedIn) {
                const dashboard = role === 'ADMIN' ? '/admin' : '/dashboard';
                return Response.redirect(new URL(dashboard, nextUrl));
            }

            // 2. Admin protection
            if (isOnAdmin) {
                if (!isLoggedIn) return false; // Redirect to sign-in
                if (role === 'ADMIN') return true;
                return Response.redirect(new URL('/dashboard', nextUrl)); // Citizen tried to access admin
            }

            // 3. User Dashboard & Report protection
            if (isOnDashboard || isOnReport) {
                if (!isLoggedIn) return false; // Redirect to sign-in

                // If an Admin tries to access Citizen areas, redirect to Admin Dashboard
                if (role === 'ADMIN') {
                    return Response.redirect(new URL('/admin', nextUrl));
                }
                return true;
            }

            // 4. Complaint detail pages - require login, both roles allowed
            if (isOnComplaints) {
                if (!isLoggedIn) return false;
                return true;
            }

            return true;
        },
    },
} satisfies NextAuthConfig;
