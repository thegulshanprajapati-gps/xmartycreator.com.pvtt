
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/admin/actions';
import { useActionState } from 'react';
import { Terminal, User, Lock } from 'lucide-react';
import Image from 'next/image';
import { Footer } from '@/components/layout/footer';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <>
      
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
          <div className="hidden bg-muted lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-destructive/10"></div>
            <div className="flex flex-col justify-center items-center h-full p-12 text-center relative">
                <Image 
                    src="/logo/1000010559.png" 
                    alt="Xmarty Creator Logo" 
                    width={100} 
                    height={100} 
                    className="mb-6"
                />
                <h2 className="text-4xl font-bold font-headline text-foreground">
                    <span className="text-destructive">X</span>marty <span className="text-destructive">C</span>reator
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Manage your vision. Inspire the world.
                </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12 px-4">
            <div className="mx-auto grid w-[400px] gap-6">
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold font-headline">Admin Portal</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your credentials to access the dashboard
                </p>
              </div>
              <form action={formAction} className="grid gap-6">
                <div className="grid gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Username"
                      required
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      placeholder="Password"
                      required 
                      className="pl-10"
                    />
                  </div>
                </div>

                {state?.error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      
      <Footer />
    </>
  );
}
