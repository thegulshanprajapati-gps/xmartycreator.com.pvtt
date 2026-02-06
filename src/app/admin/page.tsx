
import { redirect } from 'next/navigation';

// The middleware now handles the logic.
// This page will redirect logged-in users to the dashboard,
// or non-logged-in users to the login page.
export default function AdminRootPage() {
  redirect('/admin/dashboard');
}
