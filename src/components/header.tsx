'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <header className={`h-16 flex items-center justify-between px-4 ${transparent ? 'fixed top-0 left-0 right-0 z-50 bg-transparent' : 'border-b'}`}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center space-x-4">
        {toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className={`h-6 w-6 ${transparent ? 'text-white' : ''}`} />
          </Button>
        )}
        <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8">
        {mounted && (
          <Image
            src={theme === 'dark' ? '/logo-white-black.png' : '/logo-black-white.png'}
            alt="Origam.ai Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          )}
        </div>
        <h1 className={`text-xl font-semibold ${transparent ? 'text-white' : ''}`}>
        Origam.ai
        </h1>
        </Link>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center space-x-4">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8">
        {mounted && (
          <Image
            src={theme === 'dark' ? '/logo-white-black.png' : '/logo-black-white.png'}
            alt="Origam.ai Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
        )}
        </div>
        <h1 className={`text-xl font-bold ${transparent ? 'text-white' : ''}`}>
        Origam.ai
        </h1>
        </Link>
      </div>

      {session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={`relative h-8 w-8 rounded-full ${transparent ? 'absolute right-4 top-4' : ''}`}>
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