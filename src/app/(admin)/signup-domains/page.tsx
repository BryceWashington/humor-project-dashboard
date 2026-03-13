'use client'

import { useEffect, useState, Suspense } from 'react'
import { Globe, Search, PlusCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { AllowedSignupDomain } from '@/types/database'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10

function SignupDomainsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<AllowedSignupDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<AllowedSignupDomain | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<AllowedSignupDomain | null>(null)
  const [formData, setFormData] = useState({ apex_domain: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('allowed_signup_domains').select('*', { count: 'exact' })
    
    if (idFilter) {
      query = query.eq('id', idFilter)
    } else if (search) {
      query = query.ilike('apex_domain', `%${search}%`)
    }

    const { data, count } = await query
      .order('apex_domain', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setData(data || [])
    setTotalCount(count || 0)
    setLoading(false)

    if (idFilter && data?.[0]) {
      setSelectedDetail(data[0])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchData() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, idFilter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingItem) {
      await (supabase.from('allowed_signup_domains') as any).update(formData).eq('id', editingItem.id)
    } else {
      await (supabase.from('allowed_signup_domains') as any).insert(formData)
    }
    setIsSubmitting(false); setIsAdding(false); setEditingItem(null);
    setFormData({ apex_domain: '' }); fetchData();
  }

  const handleDelete = async (id: number) => {
    if (!confirm('DELETE_DOMAIN: CONFIRM_ACTION?')) return
    await (supabase.from('allowed_signup_domains') as any).delete().eq('id', id)
    fetchData()
  }

  const openEdit = (item: AllowedSignupDomain) => {
    setEditingItem(item)
    setFormData({ apex_domain: item.apex_domain })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">E-mail Gating [CRUD]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">Signup Domains</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">FIND:</div>
            <input type="text" placeholder="FILTER_BY_DOMAIN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="terminal-input pl-14 py-2 text-xs" />
          </div>
          <button onClick={() => setIsAdding(true)} className="terminal-button-accent"><PlusCircle className="w-4 h-4" />[ ADD_DOMAIN ]</button>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/2">APEX_DOMAIN</th>
                <th className="px-4 w-1/3">TIMESTAMP_ADDED</th>
                <th className="px-4 w-40 text-right">OPS</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim animate-pulse">[ ACCESSING_FIREWALL... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-terminal-dim">[ NO_DOMAINS_WHITELISTED ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">@{item.apex_domain}</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim font-mono uppercase truncate">{new Date(item.created_datetime_utc).toLocaleString()}</td>
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
          <div className="terminal-card w-full max-w-sm !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Globe className="w-3 h-3 text-terminal-accent" />
                Domain Detail
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">APEX_DOMAIN</p>
                  <p className="text-xl font-bold uppercase text-terminal-accent">@{selectedDetail.apex_domain}</p>
                </div>
                <div className="space-y-1 pt-4 border-t border-terminal-border">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">WHITELISTED_AT</p>
                  <p className="text-[10px] font-mono text-terminal-fg uppercase">{new Date(selectedDetail.created_datetime_utc).toString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">DATABASE_ID</p>
                  <p className="text-[10px] font-mono text-terminal-dim">{selectedDetail.id}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-terminal-border">
                <div className="flex gap-6 whitespace-nowrap">
                  <button 
                    onClick={() => { const item = selectedDetail; setSelectedDetail(null); openEdit(item); }} 
                    className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ EDIT_DOMAIN ]
                  </button>
                  <button 
                    onClick={() => { const id = selectedDetail.id; setSelectedDetail(null); handleDelete(id); }} 
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ DELETE_DOMAIN ]
                  </button>
                </div>
                <button onClick={() => setSelectedDetail(null)} className="terminal-button text-[10px] font-bold tracking-widest whitespace-nowrap">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || editingItem) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="terminal-card w-full max-w-sm !p-0 border border-terminal-border shadow-2xl">
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold uppercase text-[10px] tracking-widest">
              <div>{editingItem ? 'UPDATE_DOMAIN' : 'ADD_ALLOWED_DOMAIN'}</div>
              <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-terminal-dim hover:text-terminal-fg">[X]</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">DOMAIN_STRING</label>
                <input type="text" required value={formData.apex_domain} onChange={e => setFormData({...formData, apex_domain: e.target.value})} className="terminal-input py-2 text-xs" placeholder="e.g. gmail.com, university.edu" />
              </div>
              <div className="pt-4 flex justify-end gap-4 items-center">
                <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-terminal-dim hover:text-terminal-fg uppercase text-[10px] font-bold tracking-widest">[ DISCARD ]</button>
                <button type="submit" disabled={isSubmitting} className="terminal-button-accent min-w-[120px] justify-center text-[10px]">{isSubmitting ? '[ ... ]' : '[ EXECUTE_SAVE ]'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignupDomainsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ UPDATING_FIREWALL_CONFIG... ]</div>
      </div>
    }>
      <SignupDomainsContent />
    </Suspense>
  )
}
