
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { login } from '@/app/admin/actions';
import { useActionState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';


interface LoginFormProps {
  closeDialog: () => void;
}

export function LoginForm({ closeDialog }: LoginFormProps) {
  // This component is no longer used for the primary login flow,
  // but is kept in case it's needed for other purposes.
  // The main login is now at /xmartyadmin
  const [state, formAction, isPending] = useActionState(login, null);

  useEffect(() => {
    if (state?.success) {
      closeDialog();
    }
  }, [state, closeDialog]);


  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Login</DialogTitle>
        <DialogDescription>
          Enter your username and password to access your account.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
                id="username"
                name="username"
                placeholder="your.username"
                type="text"
                required
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
            />
        </div>
        
        {state?.error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

        <DialogFooter className="flex flex-col gap-4 pt-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing In...' : 'Sign In'}
            </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
