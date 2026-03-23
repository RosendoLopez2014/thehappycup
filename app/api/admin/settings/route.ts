import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/settings — fetch all store settings
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')

  if (error) {
    console.error('Failed to fetch store settings:', error)
    return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

// PATCH /api/admin/settings — update a setting by key
export async function PATCH(request: Request) {
  let key: string
  let value: unknown

  try {
    const body = await request.json()
    key = body.key
    value = body.value
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('store_settings')
    .update({ value })
    .eq('key', key)
    .select()
    .single()

  if (error) {
    console.error('Failed to update setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
