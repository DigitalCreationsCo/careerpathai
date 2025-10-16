"use client";

import { Logo } from '@/components/logo';
import GoogleButton from 'react-google-button';
import { signInWithGoogle } from './actions';

export function Login() {
  return (
    <div className="border min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-foreground">
          Sign in to GoCareerPath
        </h1>
      </div>

      <div className="flex mt-8 sm:mx-auto sm:w-full sm:max-w-md justify-center">
        <GoogleButton onClick={signInWithGoogle} />
      </div>
    </div>
  );
}
