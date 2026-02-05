
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addAdmin } from '@/app/admin/actions';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function suggestUsername(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, '.') // Replace spaces with dots
        .replace(/[^a-z0-9.]/g, '') // Remove special characters except dots
        .slice(0, 20); // Limit length
}


export function AddAdminForm() {
    const [state, formAction, isPending] = useActionState(addAdmin, { message: '' });
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [isSuggesting, startSuggestion] = useTransition();

    useEffect(() => {
        if (state?.message) {
            const isError = state.message.startsWith('Error:');
            toast({
                title: isError ? 'Error!' : 'Success!',
                description: state.message,
                variant: isError ? 'destructive' : 'default',
            });
        }
    }, [state, toast]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        startSuggestion(() => {
            setUsername(suggestUsername(newName));
        });
    };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
            <CardDescription>Create a new administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
            <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="e.g. Jane Doe"
                        required
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        placeholder="Suggested: jane.doe"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Username suggestion is based on the name.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                    />
                </div>
              
                {state?.message && state.message.startsWith('Error:') && (
                  <Alert variant="destructive" className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message.replace('Error: ', '')}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Adding Admin...' : 'Add Admin'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
