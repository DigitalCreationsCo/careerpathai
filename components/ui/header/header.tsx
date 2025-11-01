"use client"
import Link from 'next/link';
import { CircleIcon, Home, LogOut, Activity, Menu, ReceiptIcon } from 'lucide-react';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button/button';
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import useSWR, { mutate } from 'swr';
import { Logo } from '@/components/logo';

// --- fetcher and UserMenu (unchanged) ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu({ session }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!session?.user) {
    return (
      <>
        {/* <Link
          href="/pricing"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link> */}
        <Button>
          <Link href="/sign-up" className='flex flex-row items-center'>
          AI-Proof Your Career Today</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={session?.user.name || ''} />
          <AvatarFallback>
            {session?.user.name
              .split(' ')
              .map((n: any) => n[0])
              .join('')
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col bg-background">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ session }: any) {
  return (
    <header className="absolute hidden md:block w-full z-10 transition-all duration-300">
      <div className="mx-auto py-2 px-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className='hidden'>
            <Logo />
          </div>
          <span className="ml-2 font-semibold text-muted-foreground text-lg">GoCareerPath</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu session={session} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}