import NextAuth, { User, DefaultSession } from 'next-auth';
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { User as UserModel } from '@prisma/client';

declare module 'next-auth' {
    interface Session {
        user: UserModel & DefaultSession['user'];
    }
}
  
export const authOptions = {
    pages: {
        signIn: '/signin',
    },
    adapter: PrismaAdapter(prisma),
    events: {
        async createUser({ user }: { user:User }) {
            console.log(`createuser ${JSON.stringify(user)}`)
        },
        async linkAccount({ user }: { user:User }) {
            console.log(`linkAccount ${JSON.stringify(user)}`)
            await prisma.user.update({where: { id: user.id }, data: { emailVerified: new Date()}})
        }
    },
    callbacks: {
        async signIn({ /* user */ }:{ user:User }) {
            // Implement custom sign-in logic here, update profile and avatar
            return true; // Return true to allow sign-in, false to deny
        },
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)
