export const metadata = { title: 'Edit stock item' }

import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { getImageUrl } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { EditStockForm } from './edit-stock-form'
import { uploadStockImage, deleteStockImage } from './actions'

export default async function EditStockPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const [{ data: item }, { data: stockImages }] = await Promise.all([
    supabase.from('stock_items').select('*').eq('id', id).single(),
    supabase.from('stock_images').select('id, storage_path, position').eq('stock_item_id', id).order('position'),
  ])

  // Only allow editing items that haven't been published yet
  if (!item || item.status !== 'available') notFound()

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const uploadAction = uploadStockImage.bind(null, id)

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Edit stock item</h1>
          <p className="mt-2 text-sm text-stone-500">
            Update the details before publishing to the marketplace.
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <EditStockForm item={item} />

        {/* Photos */}
        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-stone-900">Photos</h2>

          {stockImages && stockImages.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {stockImages.map(img => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                  <Image
                    src={getImageUrl(img.storage_path)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                  <form action={deleteStockImage.bind(null, img.id, id)} className="absolute right-1 top-1">
                    <button
                      type="submit"
                      className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white hover:bg-black/70"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form
            action={uploadAction}
            encType="multipart/form-data"
            className="rounded-xl border border-stone-200 bg-white p-4"
          >
            <p className="mb-1 text-sm font-medium text-stone-700">Add photos</p>
            <p className="mb-3 text-xs text-stone-400">
              Select multiple files at once. These photos will carry over to the listing when you publish.
            </p>
            <div className="flex gap-3">
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                multiple
                required
                className="flex-1 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
              />
              <SubmitButton
                pendingText="Uploading…"
                className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60"
              >
                Upload
              </SubmitButton>
            </div>
            <p className="mt-2 text-xs text-stone-400">JPEG, PNG or WebP · max 5MB each</p>
          </form>
        </div>
      </main>
    </div>
  )
}
