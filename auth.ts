import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const githubId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
      // Same verified email → same User (no duplicate accounts across providers)
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      // Require an email so accounts can be uniquely keyed and linked
      if (!user.email) {
        return "/?error=EmailRequired";
      }
      return true;
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
