
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token; // 💡 บรรทัดสำคัญ
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken; // 💡 บรรทัดสำคัญ
      return session;
    },
  },
});

export { handler as GET, handler as POST };
