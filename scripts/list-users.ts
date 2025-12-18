import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listUsers() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  console.log('Users in system:');
  users.users.forEach(u => console.log('  -', u.email, u.id));
}

listUsers();
