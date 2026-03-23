import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'menu-images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// POST /api/admin/menu/upload — upload image to Supabase Storage
export async function POST(request: Request) {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB.' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Ensure the bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some((b) => b.name === BUCKET)

  if (!bucketExists) {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_TYPES,
    })

    if (bucketError) {
      console.error('Failed to create storage bucket:', bucketError)
      return NextResponse.json({ error: 'Failed to initialize storage' }, { status: 500 })
    }
  }

  // Generate a unique filename
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Failed to upload image:', uploadError)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
