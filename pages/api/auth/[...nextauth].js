import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPasswordForUser } from "../../../lib/user-store.js";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await getUserByEmail(credentials.email.toLowerCase());
        if (!user) return null;
        const valid = await verifyPasswordForUser(credentials.email.toLowerCase(), credentials.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name || user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    }
  },
  pages: {
    // optional: point to a custom signin page (we add /signin below)
    signin: "/signin"
  },
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
