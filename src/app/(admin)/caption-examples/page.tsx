'use client'

import { useEffect, useState, Suspense } from 'react'
import { HelpCircle, Search, PlusCircle, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { CaptionExample } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface CaptionExampleWithImage extends CaptionExample {
  images: { id: string; url: string | null } | null
}

function CaptionExamplesContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<CaptionExampleWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<CaptionExample | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<CaptionExampleWithImage | null>(null)
  const [formData, setFormData] = useState({ image_description: '', caption: '', explanation: '', priority: 0, image_id: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('caption_examples').select('*, images(id, url)', { count: 'exact' })
    
    if (idFilter) {
      query = query.eq('id', idFilter)
    } else if (search) {
      query = query.or(`caption.ilike.%${search}%,image_description.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('id', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setData(data as any || [])
    setTotalCount(count || 0)
    setLoading(false)

    if (idFilter && data?.[0]) {
      setSelectedDetail(data[0] as any)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, idFilter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const payload = { ...formData, image_id: formData.image_id || null }
    if (editingItem) {
      await (supabase.from('caption_examples') as any).update(payload).eq('id', editingItem.id)
    } else {
      await (supabase.from('caption_examples') as any).insert(payload)
    }
    setIsSubmitting(false); setIsAdding(false); setEditingItem(null);
    setFormData({ image_description: '', caption: '', explanation: '', priority: 0, image_id: '' }); fetchData();
  }

  const handleDelete = async (id: number) => {
    if (!confirm('DELETE_EXAMPLE: CONFIRM_ACTION?')) return
    await (supabase.from('caption_examples') as any).delete().eq('id', id)
    fetchData()
  }

  const openEdit = (item: CaptionExample) => {
    setEditingItem(item)
    setFormData({ 
      image_description: item.image_description, 
      caption: item.caption, 
      explanation: item.explanation, 
      priority: item.priority,
      image_id: item.image_id || ''
    })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Prompt Engineering Reference [CRUD]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Caption Examples</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">FIND:</div>
            <input type="text" placeholder="FILTER_BY_CONTENT..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="terminal-input pl-14 py-2 text-xs" />
          </div>
          <button onClick={() => setIsAdding(true)} className="terminal-button-accent"><PlusCircle className="w-4 h-4" />[ ADD_EXAMPLE ]</button>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-20">IMG</th>
                <th className="px-4 w-1/3">CAPTION</th>
                <th className="px-4 w-1/2">EXPLANATION</th>
                <th className="px-4 w-40 text-right">OPS</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ SCANNING_EXAMPLES... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_EXAMPLES_FOUND ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                    <div className="w-10 h-10 border border-terminal-border bg-black overflow-hidden relative grayscale opacity-40 group-hover:opacity-100 transition-opacity">
                      {item.images?.url ? <img src={item.images.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-terminal-dim" /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-terminal-fg italic text-xs truncate">"{item.caption}"</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim italic truncate">{item.explanation}</td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      <button onClick={() => openEdit(item)} className="text-terminal-dim hover:text-terminal-accent whitespace-nowrap">[ EDIT ]</button>
                      <button onClick={() => handleDelete(item.id)} className="text-terminal-dim hover:text-red-500 whitespace-nowrap">[ DEL ]</button>
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

      {selectedDetail && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}>
          <div className="terminal-card w-full max-w-4xl !p-0 border border-terminal-border shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold sticky top-0 z-10">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <HelpCircle className="w-3 h-3 text-terminal-accent" />
                Example Inspector
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 space-y-4">
                  <Link href={`/images?id=${selectedDetail.image_id}`} className="block aspect-square border border-terminal-border bg-black overflow-hidden relative group">
                    {selectedDetail.images?.url ? (
                      <>
                        <img src={selectedDetail.images.url} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.03]">
                          <span className="text-[8px] font-bold border border-terminal-fg p-1 bg-terminal-bg">VIEW_IMAGE</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full"><ImageIcon className="w-12 h-12 text-terminal-dim" /></div>
                    )}
                  </Link>
                  <div className="bg-terminal-header border border-terminal-border p-3">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">IMAGE_POINTER</p>
                    <p className="text-[10px] font-mono break-all text-terminal-accent">{selectedDetail.image_id || 'NULL'}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CAPTION_TEXT</p>
                    <p className="text-xl font-bold italic text-terminal-accent">"{selectedDetail.caption}"</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">IMAGE_DESCRIPTION</p>
                    <p className="text-sm text-terminal-fg leading-relaxed border border-terminal-border p-4 bg-terminal-header italic">{selectedDetail.image_description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">COMEDIC_EXPLANATION</p>
                    <p className="text-sm text-terminal-dim leading-relaxed border border-terminal-border p-4 bg-terminal-header">{selectedDetail.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-terminal-border">
                <div className="flex gap-6 whitespace-nowrap">
                  <button 
                    onClick={() => { const item = selectedDetail; setSelectedDetail(null); openEdit(item); }} 
                    className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ EDIT_EXAMPLE ]
                  </button>
                  <button 
                    onClick={() => { const id = selectedDetail.id; setSelectedDetail(null); handleDelete(id); }} 
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ DELETE_EXAMPLE ]
                  </button>
                </div>
                <button onClick={() => setSelectedDetail(null)} className="terminal-button text-[10px] font-bold tracking-widest whitespace-nowrap">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CaptionExamplesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ RETRIEVING_EXAMPLES_DATABASE... ]</div>
      </div>
    }>
      <CaptionExamplesContent />
    </Suspense>
  )
}
