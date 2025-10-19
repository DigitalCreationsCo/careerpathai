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


declare module "next-auth" {
  interface User {
    id?: string;
  }

  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
    };
    accessToken?: string;
  }
}

const storage = createStorage({
  driver: process.env.VERCEL
    ? vercelKVDriver({
        url: process.env.AUTH_KV_REST_API_URL,
        token: process.env.AUTH_KV_REST_API_TOKEN,
        env: false,
      })
    : memoryDriver(),
})

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: UnstorageAdapter(storage),
  basePath: "/auth",
  providers: [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  session: { 
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      let appUser = await getUserByEmail(user.email!);
      console.debug('is user exists: ', appUser);

      if (!appUser) {
        const id = user.id || generateUUID();
        console.debug('signIn: planned insert id=', id, 'user from provider=', user);
        appUser = await createUser({ ...user, id } as any)
;
      }
      return true;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === "/middleware-example") return !!auth
      return true
    },
    jwt({ user, token, trigger, session, account, profile }) {
      console.debug('jwt callback trigger: ', trigger);
      console.debug('jwt callback user: ', JSON.stringify(user));
      console.debug('jwt callback session: ', JSON.stringify(session));
      // Save Google user id into the session token
      if ((trigger === "signIn" || trigger === "signUp")) {
        if (user && user.id) {
          token.userId = user.id; 
        }
        else {
          console.error("User ID missing in jwt callback:", JSON.stringify(user));
          throw Error("User ID missing in jwt callback");
        }
      }
      if (trigger === "update" && session?.user?.name) {
        token.name = user?.name ?? token.name;
      }
      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken;
      if (!token.userId) {
        console.error("User ID missing in auth session:", JSON.stringify(token));
        throw Error("User ID missing in auth session");
      } else {
        session.user = session.user || {};
        session.user.id = token.userId as string;
      }
      console.debug('session callback, session: ', session);
      console.debug('session callback, token: ', token);
      return session;
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
  }
}