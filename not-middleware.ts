import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { auth } from "@/auth"

const protectedRoutes:string[] = [
  '/dashboard',
  '/chat',
  '/launch',
  '/draft',
  '/pricing',
  // '/early-access',
  '/early-access-non-lexicon-draft'
];

// export default auth((req) => {
//   const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

//   if (!req.auth && isProtectedRoute) {
//     const newUrl = new URL("/sign-in", req.nextUrl.origin)
//     return Response.redirect(newUrl)
//   }
// })
export default function (req) { return req; }


// export default async function auth((request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   console.log('cookies ', request.cookies);
//   const sessionCookie = request.cookies.get('authjs.session-token');

//   console.log('session Cookie ', sessionCookie);
//   const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

//   if (isProtectedRoute && !sessionCookie) {
//     return NextResponse.redirect(new URL('/sign-in', request.url));
//   }

//   let res = NextResponse.next();

//   if (sessionCookie && request.method === 'GET') {
//     try {
//       const parsed = await verifyToken(sessionCookie.value);
//       const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

//       res.cookies.set({
//         name: 'session',
//         value: await signToken({
//           ...parsed,
//           expires: expiresInOneDay.toISOString()
//         }),
//         httpOnly: true,
//         secure: true,
//         sameSite: 'lax',
//         expires: expiresInOneDay
//       });
//     } catch (error) {
//       console.error('Error updating session:', error);
//       res.cookies.delete('session');
//       if (isProtectedRoute) {
//         return NextResponse.redirect(new URL('/sign-in', request.url));
//       }
//     }
//   }

//   return res;
// });

// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
// };
