import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const results: any = {
    views_tested: [],
    errors: []
  }

  // Test feed view
  try {
    const { data, error } = await supabaseAdmin
      .from('feed')
      .select('*')
      .limit(5)

    results.views_tested.push({
      view: 'feed',
      status: error ? 'ERROR' : 'OK',
      count: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    results.errors.push({ view: 'feed', error: e.message })
  }

  // Test calendar view
  try {
    const { data, error } = await supabaseAdmin
      .from('calendar')
      .select('*')
      .limit(5)

    results.views_tested.push({
      view: 'calendar',
      status: error ? 'ERROR' : 'OK',
      count: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    results.errors.push({ view: 'calendar', error: e.message })
  }

  // Test opportunities view
  try {
    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .select('*')
      .limit(5)

    results.views_tested.push({
      view: 'opportunities',
      status: error ? 'ERROR' : 'OK',
      count: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    results.errors.push({ view: 'opportunities', error: e.message })
  }

  // Test people view
  try {
    const { data, error } = await supabaseAdmin
      .from('people')
      .select('*')
      .limit(5)

    results.views_tested.push({
      view: 'people',
      status: error ? 'ERROR' : 'OK',
      count: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    results.errors.push({ view: 'people', error: e.message })
  }

  // Test projects_view
  try {
    const { data, error } = await supabaseAdmin
      .from('projects_view')
      .select('*')
      .limit(5)

    results.views_tested.push({
      view: 'projects_view',
      status: error ? 'ERROR' : 'OK',
      count: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    results.errors.push({ view: 'projects_view', error: e.message })
  }

  // Summary
  const allOk = results.views_tested.every((v: any) => v.status === 'OK')
  results.summary = {
    total_views: results.views_tested.length,
    successful: results.views_tested.filter((v: any) => v.status === 'OK').length,
    failed: results.views_tested.filter((v: any) => v.status === 'ERROR').length,
    overall_status: allOk ? '✓ ALL VIEWS WORKING' : '✗ SOME VIEWS FAILED'
  }

  return NextResponse.json(results, { status: 200 })
}
