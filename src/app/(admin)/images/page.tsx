'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { PlusCircle, Trash2, Edit2, ImageIcon, Search, ExternalLink, X, ChevronLeft, ChevronRight, User, Database, Upload } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Image as DBImage } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface ImageWithProfile extends DBImage {
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null
}

function ImagesContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const imageIdFilter = searchParams.get('id')

  const [images, setImages] = useState<ImageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedImage, setSelectedImage] = useState<ImageWithProfile | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingImage, setEditingImage] = useState<DBImage | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({ url: '', image_description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchImages = async () => {
    setLoading(true)
    let query = supabase.from('images').select('*, profiles(first_name, last_name, email)', { count: 'exact' })
    
    if (imageIdFilter) {
      query = query.eq('id', imageIdFilter)
    } else if (search) {
      query = query.ilike('image_description', `%${search}%`)
    }

    const { data, count } = await query
      .order('created_datetime_utc', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setImages(data as any || [])
    setTotalCount(count || 0)
    setLoading(false)
    
    if (imageIdFilter && data?.[0]) {
      setSelectedImage(data[0] as any)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchImages() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, imageIdFilter])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('CONFIRM_DELETION: Are you sure you want to delete this asset?')) return
    await (supabase.from('images') as any).delete().eq('id', id)
    fetchImages()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      let imageUrl = formData.url
      let targetImageId = editingImage?.id

      if (selectedFile && !editingImage) {
        const presignedResponse = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contentType: selectedFile.type })
        })
        
        if (!presignedResponse.ok) throw new Error('FAILED_PRESIGNED_URL_GENERATION')
        const { presignedUrl, cdnUrl } = await presignedResponse.json()

        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile
        })
        
        if (!uploadResponse.ok) throw new Error('FAILED_IMAGE_UPLOAD_TO_S3')

        const registerResponse = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
        })
        
        if (!registerResponse.ok) throw new Error('FAILED_IMAGE_REGISTRATION_IN_PIPELINE')
        const { imageId } = await registerResponse.json()
        
        imageUrl = cdnUrl
        targetImageId = imageId
      }

      if (targetImageId) {
        await (supabase.from('images') as any).update({ 
          url: imageUrl, 
          image_description: formData.image_description 
        }).eq('id', targetImageId)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        await (supabase.from('images') as any).insert({ 
          url: imageUrl, 
          image_description: formData.image_description, 
          is_public: true, 
          profile_id: user?.id 
        })
      }
      
      setIsSubmitting(false); setIsAdding(false); setEditingImage(null);
      setFormData({ url: '', image_description: '' }); setSelectedFile(null);
      fetchImages();
    } catch (error) {
      console.error('SAVE_FAILED:', error)
      alert('SAVE_FAILED: Check console for details.')
      setIsSubmitting(false)
    }
  }

  const openEdit = (e: React.MouseEvent, img: DBImage) => {
    if (e) e.stopPropagation();
    setEditingImage(img);
    setFormData({ url: img.url || '', image_description: img.image_description || '' });
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Asset Registry [CRUD]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Image Assets</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">FIND:</div>
            <input type="text" placeholder="FILTER_BY_DESC..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="terminal-input pl-14 py-2 text-xs" />
          </div>
          <button onClick={() => setIsAdding(true)} className="terminal-button-accent"><PlusCircle className="w-4 h-4" />[ NEW_ASSET ]</button>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-28">PREVIEW</th>
                <th className="px-4">DESCRIPTION_METADATA</th>
                <th className="px-4 w-1/4">CONTRIBUTOR</th>
                <th className="px-4 w-40 text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && images.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ SCANNING_DATA_BLOCKS... ]</td></tr>
              ) : images.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_ASSETS_DETECTED ]</td></tr>
              ) : images.map((img) => (
                <tr key={img.id} onClick={() => setSelectedImage(img)} className="cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="w-16 aspect-video border border-terminal-border bg-black overflow-hidden relative grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
                      {img.url ? <img src={img.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-terminal-dim">NULL</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-terminal-fg/80 truncate italic">{img.image_description || '[ NO_DESC ]'}</p>
                  </td>
                  <td className="px-4 py-3 text-[10px]">
                    <span className="text-terminal-dim font-bold uppercase truncate block">{img.profiles ? `${img.profiles.first_name || ''} ${img.profiles.last_name || ''}`.trim().toUpperCase() : 'SYS'}</span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      <button onClick={(e) => openEdit(e, img)} className="text-terminal-dim hover:text-terminal-accent transition-colors whitespace-nowrap">[ EDIT ]</button>
                      <button onClick={(e) => handleDelete(e, img.id)} className="text-terminal-dim hover:text-red-500 transition-colors whitespace-nowrap">[ DEL ]</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 border-t border-terminal-border pt-6">
           <div className="text-[10px] text-terminal-dim uppercase font-bold">
            ENTRIES: {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} OF {totalCount}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="terminal-button !py-1 !px-2 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold tracking-widest uppercase">PAGE {page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="terminal-button !py-1 !px-2 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="terminal-card w-full max-w-5xl !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
             <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <ImageIcon className="w-3 h-3 text-terminal-accent" />
                Asset Inspector
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-3/5 bg-black border border-terminal-border overflow-hidden flex items-center justify-center min-h-[400px] relative">
                {selectedImage.url ? <img src={selectedImage.url} className="w-full h-full object-contain relative z-10" /> : <span className="text-terminal-dim text-xs">NULL_RESOURCE</span>}
              </div>
              <div className="w-full md:w-2/5 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest border-b border-terminal-border pb-2">METADATA_DESCRIPTION</p>
                    <p className="text-sm leading-relaxed italic">{selectedImage.image_description || '[ NO_DATA_AVAILABLE ]'}</p>
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <div className="border border-terminal-border bg-terminal-header p-4 space-y-3">
                       <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-terminal-dim" />
                          <div>
                              <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1">CONTRIBUTOR_ENTITY</p>
                              <Link href={`/users?id=${selectedImage.profile_id}`} className="font-bold text-xs uppercase tracking-tight text-terminal-accent hover:underline">{selectedImage.profiles ? `${selectedImage.profiles.first_name || ''} ${selectedImage.profiles.last_name || ''}`.trim().toUpperCase() : 'SYSTEM'}</Link>
                          </div>
                       </div>
                       <div className="space-y-1">
                           <a href={selectedImage.url} target="_blank" className="terminal-button !py-2 w-full justify-center text-[10px] tracking-widest">
                            [ VIEW_SOURCE ] <ExternalLink className="w-3 h-3 ml-2" />
                           </a>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-between items-center border-t border-terminal-border mt-auto">
                    <div className="flex gap-6 whitespace-nowrap">
                      <button 
                        onClick={(e) => { const img = selectedImage; setSelectedImage(null); openEdit(null as any, img); }} 
                        className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                      >
                        [ EDIT_ASSET ]
                      </button>
                      <button 
                        onClick={(e) => { const id = selectedImage.id; setSelectedImage(null); handleDelete(null as any, id); }} 
                        className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest whitespace-nowrap"
                      >
                        [ DELETE_ASSET ]
                      </button>
                    </div>
                    <button onClick={() => setSelectedImage(null)} className="terminal-button justify-center font-bold tracking-widest text-[10px]">CLOSE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || editingImage) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="terminal-card w-full max-w-md !p-0 border border-terminal-border shadow-2xl">
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold uppercase text-[10px] tracking-widest">
              <div>{editingImage ? 'UPDATE_ASSET' : 'CREATE_ASSET'}</div>
              <button onClick={() => { setIsAdding(false); setEditingImage(null); }} className="text-terminal-dim hover:text-terminal-fg">[X]</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {!editingImage && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">UPLOAD_LOCAL_FILE</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className={`terminal-button w-full justify-center !py-3 ${selectedFile ? 'border-terminal-accent text-terminal-accent' : ''}`}
                    >
                      <Upload className="w-4 h-4" />
                      {selectedFile ? `FILE_SELECTED: ${selectedFile.name.toUpperCase()}` : '[ SELECT_IMAGE_FILE ]'}
                    </button>
                    {selectedFile && (
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="text-[9px] text-red-500 font-bold uppercase tracking-widest block mx-auto hover:underline"
                      >
                        [ CLEAR_SELECTION ]
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-terminal-border" />
                    <span className="text-[8px] text-terminal-dim font-bold uppercase tracking-widest">OR</span>
                    <div className="h-[1px] flex-1 bg-terminal-border" />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className={`text-[10px] font-bold ${selectedFile ? 'text-terminal-dim' : 'text-terminal-fg'} uppercase block tracking-widest`}>
                  {selectedFile ? 'RESOURCE_URL (DISABLED)' : 'RESOURCE_URL'}
                </label>
                <input 
                  type="url" 
                  required={!selectedFile}
                  disabled={!!selectedFile}
                  value={formData.url} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  className={`terminal-input py-2 text-xs ${selectedFile ? 'opacity-30 cursor-not-allowed' : ''}`} 
                  placeholder="https://..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">DESCRIPTION</label>
                <textarea rows={4} value={formData.image_description} onChange={e => setFormData({...formData, image_description: e.target.value})} className="terminal-input py-2 text-xs resize-none" placeholder="Enter metadata..." />
              </div>
              <div className="pt-4 flex justify-end gap-4 items-center">
                <button type="button" onClick={() => { setIsAdding(false); setEditingImage(null); setSelectedFile(null); }} className="text-terminal-dim hover:text-terminal-fg uppercase text-[10px] font-bold tracking-widest">[ DISCARD ]</button>
                <button type="submit" disabled={isSubmitting} className="terminal-button-accent min-w-[120px] justify-center text-[10px]">{isSubmitting ? '[ ... ]' : '[ EXECUTE_SAVE ]'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono">
        <div className="text-terminal-accent animate-pulse font-bold tracking-[0.2em]">[ SYNCING_IMAGE_REPOSITORY... ]</div>
      </div>
    }>
      <ImagesContent />
    </Suspense>
  )
}
