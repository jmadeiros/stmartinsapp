/**
 * Fix project_interest RLS policy
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixRLS() {
  console.log('Fixing project_interest RLS via REST API...\n')

  // Try to create the policy using SQL execution
  // Since we can't run DDL directly, we'll output the SQL for manual execution
  console.log('The Supabase JS client cannot execute DDL statements.')
  console.log('Please run this SQL in Supabase Dashboard:\n')
  console.log('https://supabase.com/dashboard/project/pcokwakenaapsfwcrpyt/sql/new\n')

  const sql = `
-- Fix project_interest RLS
ALTER TABLE public.project_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_interest_select_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_insert_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_update_policy" ON public.project_interest;
DROP POLICY IF EXISTS "project_interest_delete_policy" ON public.project_interest;

CREATE POLICY "project_interest_select_policy"
ON public.project_interest FOR SELECT TO authenticated
USING (true);

CREATE POLICY "project_interest_insert_policy"
ON public.project_interest FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_interest_update_policy"
ON public.project_interest FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_interest_delete_policy"
ON public.project_interest FOR DELETE TO authenticated
USING (user_id = auth.uid());
`

  console.log(sql)
}

fixRLS()
