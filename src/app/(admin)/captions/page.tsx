'use client'

import { useEffect, useState, Suspense } from 'react'
import { MessageSquare, Star, Search, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Caption, Profile, Image } from '@/types/database'

const PAGE_SIZE = 10

interface CaptionWithJoins extends Caption {
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null
  images: { id: string; url: string | null; image_description: string | null } | null
}

function CaptionsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const captionIdFilter = searchParams.get('id')

  const [captions, setCaptions] = useState<CaptionWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedCaption, setSelectedCaption] = useState<CaptionWithJoins | null>(null)

  const fetchCaptions = async () => {
    setLoading(true)
    let query = supabase
      .from('captions')
      .select('*, profiles(first_name, last_name, email), images(id, url, image_description)', { count: 'exact' })
    
    if (captionIdFilter) {
      query = query.eq('id', captionIdFilter)
    } else if (search) { 
      query = query.ilike('content', `%${search}%`) 
    }

    const { data, count } = await query
      .order('created_datetime_utc', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setCaptions(data || [])
    setTotalCount(count || 0)
    setLoading(false)

    if (captionIdFilter && data?.[0]) {
      setSelectedCaption(data[0])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchCaptions() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, captionIdFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Caption Database [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Captions</h1>
        </div>
        <div className="relative w-full md:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">SEARCH:</div>
            <input 
              type="text" 
              placeholder="FILTER_BY_CONTENT..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
              className="terminal-input pl-16 py-2 text-xs" 
            />
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-16">ASSET</th>
                <th className="px-4">CONTENT_STRING</th>
                <th className="px-4 w-1/4">CONTRIBUTOR</th>
                <th className="px-4 w-40 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading && captions.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ STREAMING_RECORDS... ]</td></tr>
              ) : captions.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_RECORDS_DETECTED ]</td></tr>
              ) : captions.map((cap) => (
                <tr key={cap.id} onClick={() => setSelectedCaption(cap)} className="cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 border border-terminal-border bg-black overflow-hidden relative grayscale opacity-40 group-hover:opacity-100 transition-all">
                      {cap.images?.url ? <img src={cap.images.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-terminal-dim" /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold truncate italic">"{cap.content || '[ NULL ]'}"</p>
                  </td>
                  <td className="px-4 py-3 text-[10px]">
                    <span className="text-terminal-dim font-bold uppercase truncate block">{cap.profiles ? `${cap.profiles.first_name || ''} ${cap.profiles.last_name || ''}`.trim().toUpperCase() : 'SYS'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {cap.is_featured ? <span className="text-terminal-accent font-bold text-[9px] tracking-widest uppercase">[ FEATURED ]</span> : <span className="text-terminal-dim text-[9px] uppercase tracking-widest">Standard</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 border-t border-terminal-border pt-6">
          <div className="text-[10px] text-terminal-dim uppercase font-bold tracking-widest">
            ENTRIES: {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} OF {totalCount}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="terminal-button !py-1 !px-2 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold tracking-widest uppercase">PAGE {page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="terminal-button !py-1 !px-2 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {selectedCaption && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedCaption(null)}>
          <div className="terminal-card w-full max-w-5xl !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
             <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <MessageSquare className="w-3 h-3 text-terminal-accent" />
                Message Inspector
              </div>
              <button onClick={() => setSelectedCaption(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/2 flex flex-col gap-6">
                <div className="p-8 border border-terminal-border bg-terminal-header relative">
                   <p className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest border-b border-terminal-border pb-2 mb-4">CONTENT_STRING</p>
                  <h2 className="text-2xl font-bold italic leading-tight text-terminal-fg">"{selectedCaption.content || '[ NO_CONTENT ]'}"</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-terminal-border p-4 bg-terminal-header space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">AUTHOR_ENTITY</p>
                    <Link href={`/users?id=${selectedCaption.profile_id}`} className="font-bold text-xs truncate uppercase tracking-tight text-terminal-accent hover:underline">
                      {selectedCaption.profiles ? `${selectedCaption.profiles.first_name || ''} ${selectedCaption.profiles.last_name || ''}`.trim().toUpperCase() : 'SYSTEM'}
                    </Link>
                  </div>
                  <div className="border border-terminal-border p-4 bg-terminal-header space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">SYSTEM_STATUS</p>
                    {selectedCaption.is_featured ? <p className="font-bold text-terminal-accent text-xs uppercase tracking-widest">[ FEATURED ]</p> : <p className="font-bold text-terminal-dim uppercase text-[10px] tracking-widest">Standard</p>}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 border border-terminal-border bg-terminal-header p-6 space-y-4">
                <p className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest flex items-center gap-2 border-b border-terminal-border pb-2">
                    <ImageIcon className="w-4 h-4 text-terminal-accent" /> 
                    LINKED_ASSET
                </p>
                
                <Link 
                  href={`/images?id=${selectedCaption.images?.id}`}
                  className="block bg-black border border-terminal-border overflow-hidden min-h-[250px] relative group cursor-pointer"
                >
                  {selectedCaption.images?.url ? (
                    <>
                      <img src={selectedCaption.images.url} className="w-full h-full object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.03]">
                        <div className="p-2 border border-terminal-fg bg-terminal-bg font-bold text-[10px] tracking-widest">
                            [ VIEW_IN_GALLERY ]
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-terminal-dim text-[10px] font-bold uppercase tracking-widest">NO_ASSET_LINKED</div>
                  )}
                </Link>
                <div className="text-[9px] text-terminal-dim uppercase italic text-center tracking-widest">
                    ID_PTR: {selectedCaption.images?.id || '0x00000'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CaptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono">
        <div className="text-terminal-dim animate-pulse font-bold tracking-[0.2em]">[ STREAMING_RECORDS... ]</div>
      </div>
    }>
      <CaptionsContent />
    </Suspense>
  )
}
