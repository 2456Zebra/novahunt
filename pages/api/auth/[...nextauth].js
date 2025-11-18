import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPasswordForUser } from "../../../lib/user-store.js";

export const authOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await getUserByEmail(email);
        if (!user) return null;
        const valid = await verifyPasswordForUser(email, credentials.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = user.id; token.email = user.email; } return token; },
    async session({ session, token }) { if (token && session.user) { session.user.id = token.id; session.user.email = token.email; } return session; }
  },
  pages: { signin: '/signin' },
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
