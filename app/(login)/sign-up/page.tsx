import { Login } from '../login';
import { redirect } from 'next/navigation';

export default function SignUpPage() {
  return redirect('/sign-in');
  return (
    <Login />
  );
}
