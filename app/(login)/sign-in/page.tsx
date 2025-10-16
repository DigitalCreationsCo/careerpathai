"use server";

import { auth } from '@/auth';
import { Login } from '../login';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    return redirect('/chat');
  }
  return (
    <Login />
  );
}
