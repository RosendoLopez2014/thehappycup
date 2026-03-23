import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/inventory-log — list recent inventory log entries with ingredient name
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100)

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('inventory_log')
    .select('*, ingredients(name, unit)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch inventory log:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory log' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
