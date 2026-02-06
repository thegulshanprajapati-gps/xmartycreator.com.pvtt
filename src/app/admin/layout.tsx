
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Home,
  Info,
  Mail,
  Menu,
  Newspaper,
  PanelLeft,
  Users,
  Bell,
  LineChart,
  UserPlus,
  GalleryVertical,
  MessageSquare,
  MessageCircle,
  Shield,
  MousePointer2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { logout } from './actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const navItems = [
    { href: '/admin/dashboard', label: 'Home Page', icon: Home },
    { href: '/admin/dashboard/about', label: 'About Page', icon: Info },
    { href: '/admin/dashboard/testimonials', label: 'Testimonials', icon: MessageSquare },
    { href: '/admin/dashboard/blog', label: 'Blog Page', icon: Newspaper },
    { href: '/admin/dashboard/comments', label: 'Blog Comments', icon: MessageCircle },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/dashboard/community', label: 'Community Page', icon: Users },
    { href: '/admin/dashboard/contact', label: 'Contact Page', icon: Mail },
    { href: '/admin/dashboard/updates', label: 'Updates', icon: Bell },
    { href: '/admin/gallery', label: 'Image Gallery', icon: GalleryVertical },
    { href: '/admin/dashboard/notification', label: 'Notification', icon: LineChart },
    { href: '/admin/dashboard/appearance', label: 'Appearance', icon: MousePointer2 },
    { href: '/admin/dashboard/analytics', label: 'Analytics', icon: LineChart },
    { href: '/admin/dashboard/security', label: 'Security', icon: Shield },
    { href: '/admin/dashboard/admins', label: 'Admins', icon: UserPlus },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <TooltipProvider>
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className={cn(
          "fixed left-0 z-10 hidden h-full flex-col border-r bg-background sm:flex transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex-grow overflow-y-auto">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            {navItems.map(({ href, label, icon: Icon }) => {
                 const isActive = pathname === href;
                 return (
                    <Tooltip key={href} delayDuration={0}>
                         <TooltipTrigger asChild>
                            <Link
                                href={href}
                                className={cn(
                                    "flex h-9 w-full items-center justify-center gap-2 rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8",
                                    isSidebarCollapsed ? "" : "px-3 justify-start",
                                    isActive && "bg-accent text-accent-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className={cn("truncate", isSidebarCollapsed && "sr-only")}>{label}</span>
                            </Link>
                        </TooltipTrigger>
                        {isSidebarCollapsed && (
                             <TooltipContent side="right" className="flex items-center gap-4">
                                {label}
                            </TooltipContent>
                        )}
                    </Tooltip>
                 );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={isSidebarCollapsed ? "icon" : "default"}
                className={cn("w-full flex items-center gap-2", !isSidebarCollapsed && "justify-start")}
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  A
                </div>
                <div className={cn("flex flex-col items-start", isSidebarCollapsed && "sr-only")}>
                  <span className="font-semibold text-sm">Admin</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={logout} className="w-full">
                  <button type="submit" className="w-full text-left">Logout</button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <div className={cn(
        "flex flex-col flex-1 sm:gap-4 pt-14 sm:pt-0 transition-all duration-300", 
        isSidebarCollapsed ? "sm:pl-20" : "sm:pl-64"
      )}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <div className="flex h-full flex-col">
                <div className="flex-grow p-6 overflow-y-auto">
                  <nav className="grid gap-6 text-lg font-medium">
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={label}
                            href={href}
                            className={cn(
                                "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                                pathname === href && "text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {label}
                        </Link>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto p-4 border-t">
                  <form action={logout}>
                    <Button type="submit" variant="outline" className="w-full">Logout</Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex h-8 w-8"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="relative ml-auto flex-1 md:grow-0">
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}
