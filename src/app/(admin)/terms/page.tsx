'use client'

import { useEffect, useState } from 'react'
import { Book, Search, PlusCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Term } from '@/types/database'
import Link from 'next/link'

const PAGE_SIZE = 10

interface TermWithProfiles extends Term {
  creator: { first_name: string | null; last_name: string | null; email: string | null } | null
  modifier: { first_name: string | null; last_name: string | null; email: string | null } | null
}

export default function TermsPage() {
  const supabase = createClient()
  const [data, setData] = useState<TermWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<Term | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<TermWithProfiles | null>(null)
  const [formData, setFormData] = useState({ term: '', definition: '', example: '', priority: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('terms').select('*, creator:profiles!created_by_user_id(first_name, last_name, email), modifier:profiles!modified_by_user_id(first_name, last_name, email)', { count: 'exact' })
    if (search) {
      query = query.or(`term.ilike.%${search}%,definition.ilike.%${search}%`)
    }
    const { data, count } = await query
      .order('term', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setData(data as any || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('AUTH_ERROR: NO_USER_DETECTED')
      setIsSubmitting(false)
      return
    }

    const payload = {
      ...formData,
      modified_by_user_id: user.id,
    }

    if (editingItem) {
      await (supabase.from('terms') as any).update(payload).eq('id', editingItem.id)
    } else {
      await (supabase.from('terms') as any).insert({
        ...payload,
        created_by_user_id: user.id,
      })
    }
    setIsSubmitting(false); setIsAdding(false); setEditingItem(null);
    setFormData({ term: '', definition: '', example: '', priority: 0 }); fetchData();
  }

  const handleDelete = async (id: number) => {
    if (!confirm('DELETE_TERM: CONFIRM_ACTION?')) return
    await (supabase.from('terms') as any).delete().eq('id', id)
    fetchData()
  }

  const openEdit = (item: Term) => {
    setEditingItem(item)
    setFormData({ term: item.term, definition: item.definition, example: item.example, priority: item.priority })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Book className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Linguistic Database [CRUD]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Gen-Z Terms</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">FIND:</div>
            <input type="text" placeholder="FILTER_BY_TERM..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="terminal-input pl-14 py-2 text-xs" />
          </div>
          <button onClick={() => setIsAdding(true)} className="terminal-button-accent"><PlusCircle className="w-4 h-4" />[ ADD_TERM ]</button>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/4">TERM</th>
                <th className="px-4 w-1/2">DEFINITION</th>
                <th className="px-4 w-20 text-right">PRIO</th>
                <th className="px-4 w-40 text-right">OPS</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ ACCESSING_VOCABULARY... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_TERMS_FOUND ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => { setEditingItem(null); setSelectedDetail(item); }} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">{item.term}</td>
                  <td className="px-4 py-3 text-xs italic text-terminal-dim truncate">{item.definition}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-bold">{item.priority}</td>
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

      {(isAdding || editingItem) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="terminal-card w-full max-w-lg !p-0 border border-terminal-border shadow-2xl">
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold uppercase text-[10px] tracking-widest">
              <div>{editingItem ? 'UPDATE_TERM' : 'NEW_TERM_ENTRY'}</div>
              <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-terminal-dim hover:text-terminal-fg">[X]</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">TERM_STRING</label>
                <input type="text" required value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})} className="terminal-input py-2 text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">DEFINITION</label>
                <textarea required rows={3} value={formData.definition} onChange={e => setFormData({...formData, definition: e.target.value})} className="terminal-input py-2 text-xs resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">USAGE_EXAMPLE</label>
                <textarea required rows={2} value={formData.example} onChange={e => setFormData({...formData, example: e.target.value})} className="terminal-input py-2 text-xs resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">PRIORITY_LEVEL</label>
                <input type="number" required value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} className="terminal-input py-2 text-xs" />
              </div>
              <div className="pt-4 flex justify-end gap-4 items-center">
                <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-terminal-dim hover:text-terminal-fg uppercase text-[10px] font-bold tracking-widest">[ DISCARD ]</button>
                <button type="submit" disabled={isSubmitting} className="terminal-button-accent min-w-[120px] justify-center text-[10px]">{isSubmitting ? '[ ... ]' : '[ EXECUTE_SAVE ]'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDetail && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedDetail(null)}>
          <div className="terminal-card w-full max-w-2xl !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Book className="w-3 h-3 text-terminal-accent" />
                Term Inspector
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="border-b border-terminal-border pb-4">
                <h2 className="text-3xl font-bold uppercase tracking-tighter text-terminal-accent">{selectedDetail.term}</h2>
                <div className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest mt-1">PRIORITY_LEVEL: {selectedDetail.priority}</div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">DEFINITION</p>
                  <p className="text-sm text-terminal-fg leading-relaxed italic border border-terminal-border p-4 bg-terminal-header">{selectedDetail.definition}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">USAGE_EXAMPLE</p>
                  <p className="text-sm text-terminal-dim leading-relaxed border border-terminal-border p-4 bg-terminal-header">"{selectedDetail.example}"</p>
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

              <div className="flex justify-between items-center pt-4 border-t border-terminal-border">
                <div className="flex gap-4 whitespace-nowrap">
                  <button 
                    onClick={() => { const item = selectedDetail; setSelectedDetail(null); openEdit(item); }} 
                    className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ EDIT_TERM ]
                  </button>
                  <button 
                    onClick={() => { const id = selectedDetail.id; setSelectedDetail(null); handleDelete(id); }} 
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ DELETE_TERM ]
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
