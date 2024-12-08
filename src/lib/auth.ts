import NextAuth, { NextAuthConfig, User } from 'next-auth';
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";


export const authOptions:NextAuthConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }: { user: User }) {
      console.log(`createuser ${JSON.stringify(user)}`)
    },
    async linkAccount({ user }: { user: User }) {
      console.log(`linkAccount ${JSON.stringify(user)}`)
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
    }
  },
  callbacks: {
    async session(params) {
      const { session, token, trigger } = params;
      // Ensure `user.id` is added to the session object
      if (trigger === 'update' || token?.id) {
        session.user = { ...session.user, id: token.id as string };
      }
      return session;
    },
    async jwt(params) {
      const { token, user, trigger } = params;
      // Attach user ID to the token during "signIn" or "signUp"
      if (trigger === 'signIn' || trigger === 'signUp') {
        token.id = user?.id || token.id;
      }
      return token;
    },
    async signIn({ /* user */ }: { user: User }) {
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
