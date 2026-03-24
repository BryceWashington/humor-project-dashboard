'use client'

import { useEffect, useState, Suspense } from 'react'
import { Link2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { LLMPromptChain } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface LLMPromptChainWithAudit extends LLMPromptChain {
  creator: { first_name: string | null; last_name: string | null; email: string | null } | null
  modifier: { first_name: string | null; last_name: string | null; email: string | null } | null
}

function LLMPromptChainsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<LLMPromptChainWithAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<LLMPromptChainWithAudit | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let query = supabase.from('llm_prompt_chains').select('*, creator:profiles!created_by_user_id(first_name, last_name, email), modifier:profiles!modified_by_user_id(first_name, last_name, email)', { count: 'exact' })
      
      if (idFilter) {
        query = query.eq('id', idFilter)
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
    fetchData()
  }, [supabase, page, idFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Execution Trace Groups [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">LLM Prompt Chains</h1>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/4">CHAIN_ID</th>
                <th className="px-4 w-1/4">CAPTION_REQ_ID</th>
                <th className="px-4 text-right w-1/3">TIMESTAMP_UTC</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim animate-pulse">[ LINKING_TRACES... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim">[ NO_CHAINS_DETECTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent font-mono text-xs">{item.id}</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim font-bold uppercase">{item.caption_request_id}</td>
                  <td className="px-4 py-3 text-right text-[10px] text-terminal-dim font-mono uppercase truncate">
                    {new Date(item.created_datetime_utc).toLocaleString()}
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
                <Link2 className="w-3 h-3 text-terminal-accent" />
                Chain Detail
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CHAIN_IDENTIFIER</p>
                  <p className="text-xl font-bold font-mono text-terminal-accent">{selectedDetail.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">REQUEST_POINTER</p>
                  <Link href={`/caption-requests?id=${selectedDetail.caption_request_id}`} className="text-sm font-bold text-terminal-accent hover:underline flex items-center gap-2 uppercase">
                    <FileText className="w-3 h-3" />
                    JOB_ID: {selectedDetail.caption_request_id}
                  </Link>
                </div>
                <div className="space-y-1 border-t border-terminal-border pt-4">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">EXECUTION_START</p>
                  <p className="text-[10px] font-mono text-terminal-fg uppercase">{new Date(selectedDetail.created_datetime_utc).toString()}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-terminal-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CREATED_BY</p>
                      <Link href={`/users?id=${selectedDetail.created_by_user_id}`} className="text-[9px] font-mono text-terminal-accent hover:underline truncate block">
                        {selectedDetail.creator ? `${selectedDetail.creator.first_name || ''} ${selectedDetail.creator.last_name || ''}`.trim() || selectedDetail.creator.email : selectedDetail.created_by_user_id}
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">MODIFIED_BY</p>
                      <Link href={`/users?id=${selectedDetail.modified_by_user_id}`} className="text-[9px] font-mono text-terminal-accent hover:underline truncate block">
                        {selectedDetail.modifier ? `${selectedDetail.modifier.first_name || ''} ${selectedDetail.modifier.last_name || ''}`.trim() || selectedDetail.modifier.email : selectedDetail.modified_by_user_id}
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">CREATED_AT</p>
                      <p className="text-[9px] font-mono text-terminal-fg">{new Date(selectedDetail.created_datetime_utc).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">MODIFIED_AT</p>
                      <p className="text-[9px] font-mono text-terminal-fg">{new Date(selectedDetail.modified_datetime_utc).toLocaleString()}</p>
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

export default function LLMPromptChainsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ RETRIEVING_PROMPT_CHAINS... ]</div>
      </div>
    }>
      <LLMPromptChainsContent />
    </Suspense>
  )
}
