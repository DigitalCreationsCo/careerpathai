import { Logo } from '@/lib/utils';
import GoogleButton from 'react-google-button';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Sign in
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <GoogleButton />
      </div>
    </div>
  );
}
