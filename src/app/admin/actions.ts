
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import clientPromise from '@/lib/mongodb';

type Admin = {
  name: string;
  username: string;
  passwordHash: string;
};

async function getAdmins(): Promise<Admin[]> {
  try {
    console.log('🔄 [Auth] Fetching admins from MongoDB...');
    const client = await clientPromise;
    const db = client.db('myapp');
    const page = await db.collection('pages').findOne({ slug: 'admin' });
    
    if (page?.content?.admins) {
      console.log('✅ [Auth] Admins fetched successfully');
      return page.content.admins;
    }
    
    console.log('⚠️  [Auth] No admins found, using defaults');
    // Default admin - will be created on first use
    return [];
  } catch (error) {
    console.error('❌ [Auth] Error reading admin credentials:', error);
    throw error;
  }
}

async function saveAdmins(admins: Admin[]) {
  try {
    console.log('🔄 [Auth] Saving admins to MongoDB...');
    const client = await clientPromise;
    const db = client.db('myapp');
    
    await db.collection('pages').updateOne(
      { slug: 'admin' },
      { $set: { slug: 'admin', content: { admins } } },
      { upsert: true }
    );
    
    console.log('✅ [Auth] Admins saved successfully');
  } catch (error) {
    console.error('❌ [Auth] Error saving admins:', error);
    throw error;
  }
}


export async function login(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  try {
    console.log('🔄 [Auth] Login attempt...');
    const session = await getSession();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      console.log('⚠️  [Auth] Missing username or password');
      return { error: 'Username and password are required.' };
    }

    const admins = await getAdmins();
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      console.log('⚠️  [Auth] User not found:', username);
      return { error: 'Invalid username or password.' };
    }

    // Direct password comparison (use bcryptjs in production)
    const passwordMatch = admin.passwordHash === password || 
                         (typeof admin.passwordHash === 'string' && admin.passwordHash.startsWith('$2') ? false : admin.passwordHash === password);
    
    if (!passwordMatch) {
      console.log('⚠️  [Auth] Invalid password for user:', username);
      return { error: 'Invalid username or password.' };
    }

    session.isLoggedIn = true;
    session.username = admin.username;
    await session.save();
    
    console.log('✅ [Auth] Login successful for user:', username);
  } catch (error) {
    console.error('❌ [Auth] Login error:', error);
    return { error: 'An error occurred during login.' };
  }
  
  // Redirect after successful login (outside try-catch to avoid catching NEXT_REDIRECT)
  redirect('/admin/dashboard');
}

export async function logout() {
  try {
    const session = await getSession();
    session.destroy();
  } catch (error) {
    console.error('❌ [Auth] Logout error:', error);
  }
  
  // Redirect after logout (outside try-catch to avoid catching NEXT_REDIRECT)
  redirect('/');
}

export async function addAdmin(prevState: { message: string }, formData: FormData) {
    try {
      const session = await getSession();
      if (!session.isLoggedIn) {
          return { message: 'Error: You are not authorized.' };
      }

      const name = formData.get('name') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      if (!name || !username || !password) {
          return { message: 'Error: All fields are required.' };
      }

      const admins = await getAdmins();

      if (admins.some(a => a.username === username)) {
          return { message: 'Error: This username already exists.' };
      }

      const newAdmin: Admin = { 
        name, 
        username, 
        passwordHash: password // Direct password storage - use bcryptjs hash in production
      };
      const updatedAdmins = [...admins, newAdmin];

      await saveAdmins(updatedAdmins);

      revalidatePath('/admin/dashboard/admins');
      console.log('✅ [Auth] Admin added:', name);
      return { message: `Success: Admin "${name}" has been added.` };
    } catch (error: any) {
        console.error('❌ [Auth] Failed to add admin:', error);
        return { message: `Error: Could not add admin. ${error.message}` };
    }
}

export async function updateAdmin(prevState: { message: string }, formData: FormData) {
    try {
      const session = await getSession();
      if (!session.isLoggedIn) {
          return { message: 'Error: You are not authorized.' };
      }

      const username = formData.get('username') as string;
      const newPassword = formData.get('password') as string;

      if (!username || !newPassword) {
          return { message: 'Error: Username and password are required.' };
      }

      const admins = await getAdmins();
      const adminIndex = admins.findIndex(a => a.username === username);

      if (adminIndex === -1) {
          return { message: 'Error: Admin user not found.' };
      }

      admins[adminIndex].passwordHash = newPassword;
      await saveAdmins(admins);

      console.log('✅ [Auth] Admin password updated:', username);
      return { message: `Success: Admin "${username}" password has been updated.` };
    } catch (error: any) {
        console.error('❌ [Auth] Failed to update admin:', error);
        return { message: `Error: Could not update admin. ${error.message}` };
    }
}
