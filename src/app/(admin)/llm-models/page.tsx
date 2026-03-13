'use client'

import { useEffect, useState, Suspense } from 'react'
import { Cpu, Search, PlusCircle, ChevronLeft, ChevronRight, X, Cloud } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { LLMModel, LLMProvider } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PAGE_SIZE = 10

interface LLMModelWithProvider extends LLMModel {
  llm_providers: { id: number; name: string } | null
}

function LLMModelsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const idFilter = searchParams.get('id')

  const [data, setData] = useState<LLMModelWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<LLMModel | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<LLMModelWithProvider | null>(null)
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [formData, setFormData] = useState({ name: '', llm_provider_id: 0, provider_model_id: '', is_temperature_supported: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('llm_models').select('*, llm_providers(id, name)', { count: 'exact' })
    
    if (idFilter) {
      query = query.eq('id', idFilter)
    } else if (search) {
      query = query.or(`name.ilike.%${search}%,provider_model_id.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('name', { ascending: true })
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
    supabase.from('llm_providers').select('*').then(({ data }) => setProviders(data || []))
  }, [supabase, search, page, idFilter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingItem) {
      await (supabase.from('llm_models') as any).update(formData).eq('id', editingItem.id)
    } else {
      await (supabase.from('llm_models') as any).insert(formData)
    }
    setIsSubmitting(false); setIsAdding(false); setEditingItem(null);
    setFormData({ name: '', llm_provider_id: providers[0]?.id || 0, provider_model_id: '', is_temperature_supported: false }); fetchData();
  }

  const handleDelete = async (id: number) => {
    if (!confirm('DELETE_MODEL: CONFIRM_ACTION?')) return
    await (supabase.from('llm_models') as any).delete().eq('id', id)
    fetchData()
  }

  const openEdit = (item: LLMModel) => {
    setEditingItem(item)
    setFormData({ 
      name: item.name, 
      llm_provider_id: item.llm_provider_id, 
      provider_model_id: item.provider_model_id, 
      is_temperature_supported: item.is_temperature_supported 
    })
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">Inference Configuration [CRUD]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">LLM Models</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">FIND:</div>
            <input type="text" placeholder="FILTER_BY_NAME..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="terminal-input pl-14 py-2 text-xs" />
          </div>
          <button onClick={() => setIsAdding(true)} className="terminal-button-accent"><PlusCircle className="w-4 h-4" />[ ADD_MODEL ]</button>
        </div>
      </header>

      <div className="terminal-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="terminal-table table-fixed">
            <thead>
              <tr>
                <th className="px-4 w-1/4">NAME</th>
                <th className="px-4 w-1/4">PROVIDER</th>
                <th className="px-4">EXTERNAL_ID</th>
                <th className="px-4 w-20 text-right">TEMP?</th>
                <th className="px-4 w-40 text-right">OPS</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-terminal-dim animate-pulse">[ SCANNING_MODELS... ]</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-terminal-dim">[ NO_MODELS_FOUND ]</td></tr>
              ) : data.map((item) => (
                <tr key={item.id} onClick={() => setSelectedDetail(item)} className="cursor-pointer group">
                  <td className="px-4 py-3 font-bold text-terminal-accent uppercase text-xs truncate">{item.name}</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim uppercase font-bold truncate">{item.llm_providers?.name || 'NULL'}</td>
                  <td className="px-4 py-3 text-[10px] text-terminal-dim font-mono truncate">{item.provider_model_id}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-bold">{item.is_temperature_supported ? 'Y' : 'N'}</td>
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
          <div className="terminal-card w-full max-w-lg !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Cpu className="w-3 h-3 text-terminal-accent" />
                Model Inspector
              </div>
              <button onClick={() => setSelectedDetail(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">[X]</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">FRIENDLY_NAME</p>
                <h2 className="text-3xl font-bold uppercase tracking-tighter text-terminal-accent">{selectedDetail.name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1">PROVIDER_POINTER</p>
                  <Link href={`/llm-providers?id=${selectedDetail.llm_provider_id}`} className="text-[10px] font-bold uppercase text-terminal-accent hover:underline flex items-center gap-2">
                    <Cloud className="w-3 h-3" />
                    {selectedDetail.llm_providers?.name}
                  </Link>
                </div>
                <div className="border border-terminal-border p-3 bg-terminal-header">
                  <p className="text-[8px] font-bold text-terminal-dim uppercase mb-1">TEMP_SUPPORT</p>
                  <p className="text-[10px] font-bold uppercase">{selectedDetail.is_temperature_supported ? 'ENABLED' : 'DISABLED'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] font-bold text-terminal-dim uppercase tracking-widest">EXTERNAL_MODEL_ID_STRING</p>
                <p className="text-sm text-terminal-fg font-mono border border-terminal-border p-4 bg-terminal-header">{selectedDetail.provider_model_id}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-terminal-border">
                <div className="flex gap-6 whitespace-nowrap">
                  <button 
                    onClick={() => { const item = selectedDetail; setSelectedDetail(null); openEdit(item); }} 
                    className="text-[10px] font-bold text-terminal-accent hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ EDIT_MODEL ]
                  </button>
                  <button 
                    onClick={() => { const id = selectedDetail.id; setSelectedDetail(null); handleDelete(id); }} 
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest whitespace-nowrap"
                  >
                    [ DELETE_MODEL ]
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
          <div className="terminal-card w-full max-w-md !p-0 border border-terminal-border shadow-2xl">
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold uppercase text-[10px] tracking-widest">
              <div>{editingItem ? 'UPDATE_MODEL' : 'NEW_MODEL_CONFIG'}</div>
              <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-terminal-dim hover:text-terminal-fg">[X]</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">MODEL_NAME</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="terminal-input py-2 text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">PROVIDER</label>
                <select 
                  required 
                  value={formData.llm_provider_id} 
                  onChange={e => setFormData({...formData, llm_provider_id: parseInt(e.target.value)})} 
                  className="terminal-input py-2 text-xs bg-terminal-bg"
                >
                  <option value={0}>[ SELECT_PROVIDER ]</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-terminal-dim uppercase block tracking-widest">EXTERNAL_MODEL_ID</label>
                <input type="text" required value={formData.provider_model_id} onChange={e => setFormData({...formData, provider_model_id: e.target.value})} className="terminal-input py-2 text-xs" />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="temp_support"
                  checked={formData.is_temperature_supported} 
                  onChange={e => setFormData({...formData, is_temperature_supported: e.target.checked})} 
                  className="accent-terminal-accent"
                />
                <label htmlFor="temp_support" className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest cursor-pointer">IS_TEMPERATURE_SUPPORTED</label>
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

export default function LLMModelsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono text-terminal-dim">
        <div className="animate-pulse font-bold tracking-[0.2em]">[ SCANNING_MODEL_CATALOG... ]</div>
      </div>
    }>
      <LLMModelsContent />
    </Suspense>
  )
}
