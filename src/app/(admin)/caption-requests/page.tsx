'use client'

import { useEffect, useState, Suspense } from 'react'
import { FileText, ChevronLeft, ChevronRight, ImageIcon, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { CaptionRequest } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface CaptionRequestWithJoins extends CaptionRequest {
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null
  images: { id: string; url: string | null } | null
  creator: { first_name: string | null; last_name: string | null; email: string | null } | null
  modifier: { first_name: string | null; last_name: string | null; email: string | null } | null
}

function CaptionRequestsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<CaptionRequestWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<CaptionRequestWithJoins | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let query = supabase
        .from('caption_requests')
        .select('*, profiles!profile_id(first_name, last_name, email), images(id, url), creator:profiles!created_by_user_id(first_name, last_name, email), modifier:profiles!modified_by_user_id(first_name, last_name, email)', { count: 'exact' })
      
      if (idFilter) {
        query = query.eq('id', idFilter)
      }

      const { data, count } = await query
        .order('created_datetime_utc', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      
      setData(data as any || [])
      setTotalCount(count || 0)
      setLoading(false)

      if (idFilter && data?.[0]) {
        setSelectedDetail(data[0] as any)
      }
    }
    fetchData()
  }, [supabase, page, idFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Generation Jobs [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Caption Requests</h1>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-20">IMG</th>
                <th className="px-4">REQUESTER</th>
                <th className="px-4 w-1/3">TIMESTAMP_UTC</th>
                <th className="px-4 w-32 text-right">REQ_ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ MONITORING_QUEUE... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_REQUESTS_DETECTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 border border-terminal-border bg-black overflow-hidden relative grayscale opacity-40 group-hover:opacity-100 transition-opacity">
                      {item.images?.url ? <img src={item.images.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-terminal-dim" /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold uppercase truncate">
                    {item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || item.profiles.email : 'SYS_USER'}
                  </td>
                  <td className="px-4 py-3 text-xs text-terminal-dim font-mono uppercase truncate">
                    {new Date(item.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-terminal-accent font-bold">
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
          <div className="terminal-card w-full max-w-2xl !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <FileText className="w-3 h-3 text-terminal-accent" />
                Job Inspector
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
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">REQUEST_ID</p>
                    <p className="text-[10px] font-mono text-terminal-accent">{selectedDetail.id}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">REQUESTING_ENTITY</p>
                    <Link href={`/users?id=${selectedDetail.profile_id}`} className="text-xl font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedDetail.profiles ? `${selectedDetail.profiles.first_name || ''} ${selectedDetail.profiles.last_name || ''}`.trim() : 'UNKNOWN'}
                    </Link>
                    <p className="text-[10px] text-terminal-dim font-mono">{selectedDetail.profiles?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">SUBMISSION_TIME</p>
                    <p className="text-xs text-terminal-fg font-mono uppercase bg-terminal-header p-3 border border-terminal-border">
                      {new Date(selectedDetail.created_datetime_utc).toString()}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-terminal-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 border border-terminal-border p-3 bg-terminal-header">
                        <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CREATED_BY</p>
                        <Link href={`/users?id=${selectedDetail.created_by_user_id}`} className="text-[9px] font-mono text-terminal-accent hover:underline truncate block">
                          {selectedDetail.creator ? `${selectedDetail.creator.first_name || ''} ${selectedDetail.creator.last_name || ''}`.trim() || selectedDetail.creator.email : selectedDetail.created_by_user_id}
                        </Link>
                      </div>
                      <div className="space-y-1 border border-terminal-border p-3 bg-terminal-header">
                        <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">MODIFIED_BY</p>
                        <Link href={`/users?id=${selectedDetail.modified_by_user_id}`} className="text-[9px] font-mono text-terminal-accent hover:underline truncate block">
                          {selectedDetail.modifier ? `${selectedDetail.modifier.first_name || ''} ${selectedDetail.modifier.last_name || ''}`.trim() || selectedDetail.modifier.email : selectedDetail.modified_by_user_id}
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 border border-terminal-border p-3 bg-terminal-header">
                        <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CREATED_AT</p>
                        <p className="text-[9px] font-mono text-terminal-fg">{new Date(selectedDetail.created_datetime_utc).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1 border border-terminal-border p-3 bg-terminal-header">
                        <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">MODIFIED_AT</p>
                        <p className="text-[9px] font-mono text-terminal-fg">{new Date(selectedDetail.modified_datetime_utc).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
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

export default function CaptionRequestsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ SYNCHRONIZING_JOB_QUEUE... ]</div>
      </div>
    }>
      <CaptionRequestsContent />
    </Suspense>
  )
}
