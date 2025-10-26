import NextAuth from "next-auth"
import "next-auth/jwt"
import Google from "next-auth/providers/google"
import { createStorage } from "unstorage"
import memoryDriver from "unstorage/drivers/memory"
import vercelKVDriver from "unstorage/drivers/vercel-kv"
import { UnstorageAdapter } from "@auth/unstorage-adapter"
import { createUser, getUserByEmail } from "./lib/db/queries/user"
import { NewUser } from "./lib/types"
import { generateUUID } from "./lib/utils"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db/drizzle"
import { sessions, accounts, users, verificationTokens } from "./lib/db/schema"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  basePath: "/auth",
  providers: [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { 
    strategy: "database",
  },
})