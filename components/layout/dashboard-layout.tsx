'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Materials', href: '/dashboard/materials' },
  { name: 'Production', href: '/dashboard/production' },
  { name: 'Clients', href: '/dashboard/clients' },
  { name: 'Suppliers', href: '/dashboard/suppliers' },
  { name: 'Ledger', href: '/dashboard/ledger' },
  { name: 'Analytics', href: '/dashboard/analytics' },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  const pathname = usePathname();

  const navigationContent = (
    <div className="flex flex-col gap-2 p-2">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">BANWALO</h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Button key={item.href} variant={pathname === item.href ? 'default' : 'ghost'} className="w-full justify-start" asChild>
              <Link href={item.href}>{item.name}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="m-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar className="border-0">{navigationContent}</Sidebar>
            </SheetContent>
          </Sheet>
        ) : (
          <Sidebar className="hidden md:block">{navigationContent}</Sidebar>
        )}
        <div className="flex-1 overflow-auto w-full">{children}</div>
      </div>
    </SidebarProvider>
  );
}
