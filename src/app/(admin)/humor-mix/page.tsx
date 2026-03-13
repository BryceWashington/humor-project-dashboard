'use client'

import { useEffect, useState, Suspense } from 'react'
import { Zap, X, ChevronLeft, ChevronRight, Smile } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { HumorFlavorMix, HumorFlavor } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface HumorFlavorMixWithFlavor extends HumorFlavorMix {
  humor_flavors: { id: number; slug: string } | null
}

function HumorMixContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<HumorFlavorMixWithFlavor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [editingItem, setEditingItem] = useState<HumorFlavorMix | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<HumorFlavorMixWithFlavor | null>(null)
  const [flavors, setFlavors] = useState<HumorFlavor[]>([])
  const [formData, setFormData] = useState({ humor_flavor_id: 0, caption_count: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('humor_flavor_mix')
      .select('*, humor_flavors(id, slug)', { count: 'exact' })
    
    if (idFilter) {
      query = query.eq('id', idFilter)
    }

    const { data, count } = await query
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setData(data as any || [])
    setTotalCount(count || 0)
    setLoading(false)

    if (idFilter && data?.[0]) {
      setSelectedDetail(data[0] as any)
    }
  }

  useEffect(() => {
    fetchData()
    supabase.from('humor_flavors').select('*').then(({ data }) => setFlavors(data || []))
  }, [supabase, page, idFilter])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setIsSubmitting(true)
    await (supabase.from('humor_flavor_mix') as any).update({ 
      humor_flavor_id: formData.humor_flavor_id,
      caption_count: formData.caption_count
    }).eq('id', editingItem.id)
    setIsSubmitting(false)
    setEditingItem(null)
    fetchData()
  }

  const openEdit = (item: HumorFlavorMix) => {
    setEditingItem(item)
    setFormData({ humor_flavor_id: item.humor_flavor_id, caption_count: item.caption_count })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Generation Weightings [READ/UPDATE]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Humor Flavor Mix</h1>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-32">MIX_ID</th>
                <th className="px-4">FLAVOR_IDENTITY</th>
                <th className="px-4 w-1/3">CAPTION_COUNT</th>
                <th className="px-4 w-40 text-right">OPS</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ SCANNING_CONFIG_SLOTS... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_MIX_CONFIG_DETECTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 text-xs text-terminal-dim">
                    {item.id}
                  </td>
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">
                    {item.humor_flavors?.slug || `ID:${item.humor_flavor_id}`}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">
                    {item.caption_count}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => openEdit(item)}
                      className="text-[10px] font-bold text-terminal-dim hover:text-terminal-accent tracking-widest uppercase whitespace-nowrap"
                    >
                      [ EDIT ]
                    </button>
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
          <div className="terminal-card w-full max-w-sm !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Zap className="w-3 h-3 text-terminal-accent" />
                Mix Detail
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">FLAVOR_POINTER</p>
                  <Link href={`/humor-flavors?id=${selectedDetail.humor_flavor_id}`} className="text-xl font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <Smile className="w-4 h-4" />
                    {selectedDetail.humor_flavors?.slug}
                  </Link>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CAPTION_COUNT_TARGET</p>
                  <p className="text-2xl font-bold text-terminal-fg">{selectedDetail.caption_count}</p>
                </div>
                <div className="space-y-1 border-t border-terminal-border pt-4">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CONFIGURATION_ID</p>
                  <p className="text-[10px] font-mono text-terminal-dim">{selectedDetail.id}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-terminal-border">
                <button 
                  onClick={() => { const item = selectedDetail; setSelectedDetail(null); openEdit(item); }} 
                  className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                >
                  [ EDIT_MIX_CONFIG ]
                </button>
                <button onClick={() => setSelectedDetail(null)} className="terminal-button text-[10px] font-bold tracking-widest whitespace-nowrap">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="terminal-card w-full max-w-md !p-0 border border-terminal-border shadow-2xl">
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold uppercase text-[10px] tracking-widest">
              <div>UPDATE_MIX_CONFIG</div>
              <button onClick={() => setEditingItem(null)} className="text-terminal-dim hover:text-terminal-fg">[X]</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">SELECT_FLAVOR</label>
                <select 
                  required 
                  value={formData.humor_flavor_id} 
                  onChange={e => setFormData({...formData, humor_flavor_id: parseInt(e.target.value)})} 
                  className="terminal-input py-2 text-xs bg-terminal-bg"
                >
                  {flavors.map(f => (
                    <option key={f.id} value={f.id}>{f.slug.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">CAPTION_COUNT</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  max="10"
                  value={formData.caption_count} 
                  onChange={e => setFormData({...formData, caption_count: parseInt(e.target.value)})} 
                  className="terminal-input py-2 text-xs"
                />
              </div>
              <div className="pt-4 flex justify-end gap-4 items-center">
                <button type="button" onClick={() => setEditingItem(null)} className="text-terminal-dim hover:text-terminal-fg uppercase text-[10px] font-bold tracking-widest">[ DISCARD ]</button>
                <button type="submit" disabled={isSubmitting} className="terminal-button-accent min-w-[120px] justify-center text-[10px]">{isSubmitting ? '[ ... ]' : '[ EXECUTE_UPDATE ]'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HumorMixPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ CALCULATING_FLAVOR_MIX... ]</div>
      </div>
    }>
      <HumorMixContent />
    </Suspense>
  )
}
