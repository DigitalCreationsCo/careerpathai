import { Login } from '../login';
import { redirect } from 'next/navigation';

export default function SignUpPage() {
  redirect('/sign-in');
  return (
    <Login />
  );
}
