'use client'

import { useEffect, useState, Suspense } from 'react'
import { Activity, ChevronLeft, ChevronRight, X, Terminal as TerminalIcon, Cpu, Smile, FileText, Link2, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { LLMModelResponse } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface LLMModelResponseWithJoins extends LLMModelResponse {
  llm_models: { id: number; name: string } | null
  humor_flavors: { id: number; slug: string } | null
}

function LLMResponsesContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<LLMModelResponseWithJoins[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedItem, setSelectedItem] = useState<LLMModelResponseWithJoins | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let query = supabase
        .from('llm_model_responses')
        .select('*, llm_models(id, name), humor_flavors(id, slug)', { count: 'exact' })
      
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
        setSelectedItem(data[0] as any)
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
            <Activity className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Model Execution Logs [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">LLM Responses</h1>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/4">MODEL</th>
                <th className="px-4 w-1/4">FLAVOR</th>
                <th className="px-4 w-20">LATENCY</th>
                <th className="px-4">TIMESTAMP</th>
                <th className="px-4 w-24 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-terminal-dim animate-pulse">[ ANALYZING_TRAFFIC... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-terminal-dim">[ NO_RESPONSES_DETECTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">{item.llm_models?.name || 'NULL'}</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim uppercase font-bold truncate">{item.humor_flavors?.slug || 'NULL'}</td>
                  <td className="px-4 py-3 text-[10px] font-mono">{item.processing_time_seconds}s</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim font-mono uppercase truncate">{new Date(item.created_datetime_utc).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[10px] text-terminal-accent font-bold whitespace-nowrap">[ VIEW ]</td>
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

      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div className="terminal-card w-full max-w-4xl !p-0 border border-terminal-border shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold sticky top-0 z-10">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Activity className="w-3 h-3 text-terminal-accent" />
                Response Inspector
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">MODEL_POINTER</p>
                  <Link href={`/llm-models?id=${selectedItem.llm_model_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <Cpu className="w-3 h-3" />
                    {selectedItem.llm_models?.name}
                  </Link>
                </div>
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">FLAVOR_POINTER</p>
                  <Link href={`/humor-flavors?id=${selectedItem.humor_flavor_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <Smile className="w-3 h-3" />
                    {selectedItem.humor_flavors?.slug}
                  </Link>
                </div>
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">USER_POINTER</p>
                  <Link href={`/users?id=${selectedItem.profile_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <User className="w-3 h-3" />
                    UID: {selectedItem.profile_id.substring(0,8)}
                  </Link>
                </div>
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">CHAIN_POINTER</p>
                  {selectedItem.llm_prompt_chain_id ? (
                    <Link href={`/llm-prompt-chains?id=${selectedItem.llm_prompt_chain_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                      <Link2 className="w-3 h-3" />
                      CID: {selectedItem.llm_prompt_chain_id}
                    </Link>
                  ) : <span className="text-[10px] text-terminal-dim uppercase font-bold tracking-widest">NONE</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">JOB_POINTER</p>
                  <Link href={`/caption-requests?id=${selectedItem.caption_request_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    REQ_ID: {selectedItem.caption_request_id}
                  </Link>
                </div>
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1 tracking-widest">LATENCY_TRACE</p>
                  <p className="text-[10px] font-bold uppercase text-terminal-fg">{selectedItem.processing_time_seconds} SECONDS</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-terminal-border bg-terminal-header">
                  <div className="bg-terminal-border/20 px-4 py-1 text-[8px] font-bold text-terminal-dim uppercase tracking-widest">SYSTEM_PROMPT</div>
                  <pre className="p-4 text-[10px] whitespace-pre-wrap text-terminal-dim leading-relaxed font-mono">{selectedItem.llm_system_prompt}</pre>
                </div>
                <div className="border border-terminal-border bg-terminal-header">
                  <div className="bg-terminal-border/20 px-4 py-1 text-[8px] font-bold text-terminal-dim uppercase tracking-widest">USER_PROMPT</div>
                  <pre className="p-4 text-[10px] whitespace-pre-wrap text-terminal-dim leading-relaxed font-mono">{selectedItem.llm_user_prompt}</pre>
                </div>
                <div className="border border-terminal-accent/30 bg-terminal-header">
                  <div className="bg-terminal-accent/10 px-4 py-1 text-[8px] font-bold text-terminal-accent uppercase tracking-widest">LLM_RESPONSE_STRING</div>
                  <pre className="p-4 text-xs whitespace-pre-wrap text-terminal-fg leading-relaxed font-bold font-mono">{selectedItem.llm_model_response}</pre>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-terminal-border">
                <button onClick={() => setSelectedItem(null)} className="terminal-button uppercase text-[10px] font-bold tracking-widest">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LLMResponsesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ PARSING_EXECUTION_LOGS... ]</div>
      </div>
    }>
      <LLMResponsesContent />
    </Suspense>
  )
}
