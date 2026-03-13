'use client'

import { useEffect, useState, Suspense } from 'react'
import { Smile, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { HumorFlavor } from '@/types/database'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10

function HumorFlavorsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<HumorFlavor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<HumorFlavor | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let query = supabase.from('humor_flavors').select('*', { count: 'exact' })
      
      if (idFilter) {
        query = query.eq('id', idFilter)
      } else if (search) {
        query = query.or(`slug.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data, count } = await query
        .order('id', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      
      setData(data || [])
      setTotalCount(count || 0)
      setLoading(false)

      if (idFilter && data?.[0]) {
        setSelectedDetail(data[0])
      }
    }
    const timer = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, idFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smile className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Voice Strategies [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Humor Flavors</h1>
        </div>
        <div className="relative w-full md:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">QUERY:</div>
          <input 
            type="text" 
            placeholder="FILTER_BY_SLUG..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="terminal-input pl-16 text-xs py-2"
          />
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/3">SLUG</th>
                <th className="px-4">DESCRIPTION</th>
                <th className="px-4 text-right w-32">ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim animate-pulse">[ STREAMING_RECORDS... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim">[ NO_FLAVORS_DETECTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">
                    {item.slug}
                  </td>
                  <td className="px-4 py-3 text-xs italic text-terminal-dim truncate">
                    {item.description || '[ NO_DESC ]'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-terminal-dim font-mono">
                    {item.id}
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
          <div className="terminal-card w-full max-w-lg !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Smile className="w-3 h-3 text-terminal-accent" />
                Flavor Inspector
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">SLUG_IDENTIFIER</p>
                <h2 className="text-3xl font-bold uppercase tracking-tighter text-terminal-accent">{selectedDetail.slug}</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">SYSTEM_ID</p>
                  <p className="text-sm text-terminal-fg font-mono">{selectedDetail.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">STRATEGY_DESCRIPTION</p>
                  <p className="text-sm text-terminal-fg leading-relaxed italic border border-terminal-border p-4 bg-terminal-header">{selectedDetail.description || 'NO_DESCRIPTION_PROVIDED'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-terminal-border">
                <button onClick={() => setSelectedDetail(null)} className="terminal-button text-[10px] font-bold tracking-widest">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HumorFlavorsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ RETRIEVING_FLAVOR_STRATEGIES... ]</div>
      </div>
    }>
      <HumorFlavorsContent />
    </Suspense>
  )
}
