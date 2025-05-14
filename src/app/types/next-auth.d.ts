// types/next-auth.d.ts หรือไฟล์ .d.ts ใด ๆ ที่เหมาะสม
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
