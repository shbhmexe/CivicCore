import { DefaultSession } from "next-auth"
// import { JWT } from "next-auth/jwt"
import { Role } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
        } & DefaultSession["user"]
    }

    interface User {
        role: Role // Use string if enum import fails, but Role is better
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: Role
    }
}
