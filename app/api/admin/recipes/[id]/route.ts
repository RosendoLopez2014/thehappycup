import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/admin/recipes/[id] — delete a recipe and its ingredients (cascade)
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
