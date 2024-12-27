
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo'

type HeaderProps = {
  transparent?: boolean;
  toggleSidebar?: () => void; 
};

export function Header({ toggleSidebar, transparent = false }: HeaderProps) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className={`h-10 flex items-center justify-between py-1 px-2 
      ${transparent ? 'fixed top-0 left-0 right-0 z-50 bg-transparent' : ''}`}
    >
      {/* Left: Logo */}
      <Link href="/">
        {mounted && (<Logo theme={theme || 'light'} />)}
      </Link>

      {/* Right: User Avatar */}
      {session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem className="flex items-center">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span>{session.user.email || ''}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme('light'); localStorage.setItem('theme', 'light'); }}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light mode</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setTheme('dark'); localStorage.setItem('theme', 'dark'); }}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark mode</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}