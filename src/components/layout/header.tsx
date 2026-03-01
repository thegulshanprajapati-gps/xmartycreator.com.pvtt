"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Menu,
  Bell,
  BookOpen,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { SearchDialog, type SearchableItem } from '../search-dialog';
import { useSession as useAdminSession } from '../auth/session-provider';
import { logout } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import UpdateBell from '@/components/update-bell';
import { signOut, useSession as useStudentSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/community', label: 'Community' },
  { href: '/blog', label: 'Blog' },
  { href: '/updates', label: 'Updates' },
];

const utilitySearchLinks: SearchableItem[] = [
  { href: '/terms-of-service', label: 'Terms of Service', description: 'Legal' },
  { href: '/privacy-policy', label: 'Privacy Policy', description: 'Legal' },
  { href: '/tos', label: 'TOS', description: 'Legal alias' },
  { href: '/privacy-and-policy', label: 'Privacy and Policy', description: 'Legal alias' },
  { href: '/sitemap.xml', label: 'Sitemap XML', description: 'SEO' },
];

const defaultSearchItems: SearchableItem[] = [...navLinks, ...utilitySearchLinks];

const studentQuickLinks = [
  { href: '/student/edit', label: 'Student Profile' },
  { href: '/student/courses', label: 'Courses / Tests Enrolled' },
];

type CredentialStudentSessionUser = {
  email: string;
  name: string;
  image: string;
  mobile: string;
};

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAdminSession();
  const { data: studentSession, status: studentStatus } = useStudentSession();
  const { toast } = useToast();
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/xmartyadmin');
  const isBceceLeRoute = pathname === '/bcece-le' || pathname.startsWith('/bcece-le/');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>(defaultSearchItems);
  const [loginButtonOnlyOnBceceLe, setLoginButtonOnlyOnBceceLe] = useState(false);
  const [credentialStudent, setCredentialStudent] = useState<CredentialStudentSessionUser | null>(null);
  const [loadingCredentialStudent, setLoadingCredentialStudent] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/pages/courses', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          setSearchableItems(defaultSearchItems);
          return;
        }

        const coursesContent = await res.json();
        if (!coursesContent?.courses || !Array.isArray(coursesContent.courses)) {
          setSearchableItems(defaultSearchItems);
          return;
        }

        const courses = coursesContent.courses.map((course: any) => ({
          ...course,
          image: PlaceHolderImages.find((img) => img.id === course.imageId),
        }));

        const searchableCourses: SearchableItem[] = courses.map((course: any) => ({
          href: '/courses',
          label: course.title || 'Course',
          description: 'Course',
        }));

        setSearchableItems([...defaultSearchItems, ...searchableCourses]);
      } catch (error) {
        console.warn('Could not fetch courses - using defaults:', error);
        setSearchableItems(defaultSearchItems);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSiteSettings = async () => {
      try {
        const cached = localStorage.getItem('xmarty:loginOnlyOnBceceLe');
        if (!cancelled && (cached === 'true' || cached === 'false')) {
          setLoginButtonOnlyOnBceceLe(cached === 'true');
        }
      } catch {
        // ignore storage errors
      }

      try {
        const response = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data?.loginButtonOnlyOnBceceLe === 'boolean') {
          setLoginButtonOnlyOnBceceLe(data.loginButtonOnlyOnBceceLe);
        }
      } catch (error) {
        console.warn('Could not fetch site settings - using defaults:', error);
      }
    };

    const handleSiteSettingsUpdate = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (typeof detail?.loginButtonOnlyOnBceceLe === 'boolean') {
        setLoginButtonOnlyOnBceceLe(detail.loginButtonOnlyOnBceceLe);
      }
    };

    fetchSiteSettings();
    window.addEventListener('site-settings-updated', handleSiteSettingsUpdate as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener('site-settings-updated', handleSiteSettingsUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCredentialSession = async () => {
      if (studentStatus === 'authenticated') {
        if (active) {
          setLoadingCredentialStudent(false);
        }
        return;
      }

      let hasCredentialToken = false;
      try {
        hasCredentialToken = Boolean(localStorage.getItem('student_portal_token'));
      } catch {
        hasCredentialToken = false;
      }

      if (!hasCredentialToken) {
        if (active) {
          setCredentialStudent(null);
          setLoadingCredentialStudent(false);
        }
        return;
      }

      try {
        setLoadingCredentialStudent(true);
        const response = await fetch('/api/auth/student-session', {
          cache: 'no-store',
        });

        if (!active) return;
        if (!response.ok) {
          if (response.status === 401) {
            try {
              localStorage.removeItem('student_portal_token');
            } catch {
              // ignore localStorage errors
            }
          }
          setCredentialStudent(null);
          return;
        }

        const data = await response.json();
        const user = data?.user;
        if (data?.authenticated && typeof user?.email === 'string') {
          setCredentialStudent({
            email: user.email,
            name: typeof user?.name === 'string' ? user.name : 'Student',
            image: typeof user?.image === 'string' ? user.image : '',
            mobile: typeof user?.mobile === 'string' ? user.mobile : '',
          });
          return;
        }

        setCredentialStudent(null);
      } catch (error) {
        if (active) {
          console.warn('[header] Could not load credential student session:', error);
          setCredentialStudent(null);
        }
      } finally {
        if (active) {
          setLoadingCredentialStudent(false);
        }
      }
    };

    const handleWindowFocus = () => {
      void loadCredentialSession();
    };

    void loadCredentialSession();
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [pathname, studentStatus]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const handleStudentLogout = async () => {
    if (studentStatus === 'authenticated') {
      await signOut({ callbackUrl: '/' });
      return;
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[header] credential logout failed:', error);
    }

    try {
      localStorage.removeItem('student_portal_token');
    } catch {
      // ignore localStorage errors
    }

    setCredentialStudent(null);
    window.location.href = '/';
  };

  const activeStudent =
    studentStatus === 'authenticated'
      ? {
          email: studentSession?.user?.email || '',
          name: studentSession?.user?.name || 'Student',
          image: studentSession?.user?.image || '',
          mobile: '',
        }
      : credentialStudent;
  const studentName = activeStudent?.name || 'Student';
  const studentInitial = studentName.charAt(0).toUpperCase();
  const studentEmail = activeStudent?.email || 'Student account';
  const studentIsLoading =
    studentStatus === 'loading' || loadingCredentialStudent;
  const isStudentAuthenticated = Boolean(activeStudent?.email);
  const canShowStudentLoginButton = !loginButtonOnlyOnBceceLe || isBceceLeRoute;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full select-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 min-w-0 items-center justify-between px-3 sm:px-4 md:px-6">
          <Link href="/" className="mr-1 flex min-w-0 flex-1 items-center space-x-2 md:mr-6 md:flex-none">
            <Image src="/logo/1000010559.png" alt="Xmarty Creator Logo" width={32} height={32} className="h-8 w-8" />
            <span className="max-w-[130px] truncate font-bold font-headline text-base min-[380px]:max-w-[170px] sm:max-w-none sm:text-lg">
              Xmarty Creator
            </span>
          </Link>

          <nav className="hidden select-none md:flex flex-1 items-center justify-center text-sm font-medium">
            <ul className="flex items-center gap-2">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <li key={href} className="relative group">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Link
                        href={href}
                        prefetch={true}
                        className={cn(
                          'relative block rounded-full px-4 py-2 transition',
                          isActive ? 'text-primary-foreground' : 'text-foreground/60 hover:text-primary'
                        )}
                      >
                        {label}
                      </Link>
                    </motion.div>
                    {isActive && (
                      <motion.span
                        layoutId="active-nav-indicator"
                        className="absolute inset-0 rounded-full bg-destructive -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 min-[380px]:gap-2 md:gap-4">
            <UpdateBell />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setShowSearch(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Dialog open={showSearch} onOpenChange={setShowSearch}>
              <SearchDialog searchableItems={searchableItems} onSelect={() => setShowSearch(false)} />
            </Dialog>
            {!isAdminRoute && !studentIsLoading && (
              isStudentAuthenticated ? (
                <div className="hidden md:flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto items-center gap-2 px-2 py-1.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activeStudent?.image || ''} alt={studentName} />
                          <AvatarFallback>{studentInitial}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 text-left">
                          <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                            Student Profile
                          </p>
                          <p className="max-w-[120px] truncate text-sm text-foreground/80">
                            {studentName}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel className="space-y-0.5">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          Student Profile
                        </p>
                        <p className="truncate text-sm font-medium">{studentName}</p>
                        <p className="truncate text-xs text-muted-foreground">{studentEmail}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/student/notifications">
                          <Bell className="mr-2 h-4 w-4" />
                          Notifications
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/student/edit">
                          <User className="mr-2 h-4 w-4" />
                          Student Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/student/courses">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Courses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          void handleStudentLogout();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                canShowStudentLoginButton ? (
                  <Button asChild className="hidden md:inline-flex">
                    <Link href="/login">Student Login</Link>
                  </Button>
                ) : null
              )
            )}
            {isAdminRoute && !isLoggedIn && (
              <Button asChild className="hidden md:inline-flex">
                <Link href="/xmartyadmin">Admin Login</Link>
              </Button>
            )}
            {isLoggedIn && (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild>
                  <Link href="/admin/dashboard">Dashboard</Link>
                </Button>
                <form action={handleLogout}>
                  <Button variant="outline" type="submit">Logout</Button>
                </form>
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-6">
                  <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                    <Image src="/logo/1000010559.png" alt="Xmarty Creator Logo" width={32} height={32} />
                    <span className="font-bold font-headline text-lg">Xmarty Creator</span>
                  </Link>
                  <nav className="flex select-none flex-col gap-4">
                    {navLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        prefetch={true}
                        onClick={closeMobileMenu}
                        className={cn(
                          'text-lg transition-colors hover:text-primary',
                          pathname === href ? 'text-primary font-semibold' : 'text-foreground/80'
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Student Sections
                    </p>
                    <div className="flex flex-col gap-2">
                      {studentQuickLinks.map(({ href, label }) => (
                        <Button
                          key={href}
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                          onClick={closeMobileMenu}
                        >
                          <Link href={href}>{label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => { closeMobileMenu(); setShowSearch(true); }}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                  {!isAdminRoute && !studentIsLoading && (
                    isStudentAuthenticated ? (
                      <div className="mt-4 flex flex-col gap-3">
                        <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                          <Link href="/student/notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                          <Link href="/student/edit">Student Profile</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                          <Link href="/student/courses">Courses / Tests Enrolled</Link>
                        </Button>
                        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activeStudent?.image || ''} alt={studentName} />
                            <AvatarFallback>{studentInitial}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{studentName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {studentEmail}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            closeMobileMenu();
                            void handleStudentLogout();
                          }}
                        >
                          Sign out
                        </Button>
                      </div>
                    ) : (
                      canShowStudentLoginButton ? (
                        <div className="mt-4">
                          <Button asChild className="w-full" onClick={closeMobileMenu}>
                            <Link href="/login">Student Login</Link>
                          </Button>
                        </div>
                      ) : null
                    )
                  )}
                  {isAdminRoute && !isLoggedIn && (
                    <div className="mt-4">
                      <Button asChild className="w-full" onClick={closeMobileMenu}>
                        <Link href="/xmartyadmin">Admin Login</Link>
                      </Button>
                    </div>
                  )}
                  {isLoggedIn && (
                    <div className="flex flex-col gap-4 mt-4">
                      <Button asChild className="w-full" onClick={closeMobileMenu}>
                        <Link href="/admin/dashboard">Dashboard</Link>
                      </Button>
                      <form action={handleLogout}>
                        <Button variant="outline" className="w-full" type="submit" onClick={closeMobileMenu}>Logout</Button>
                      </form>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
