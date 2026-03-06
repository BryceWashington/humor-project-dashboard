'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, User, Star, Search, X, ChevronLeft, ChevronRight, ImageIcon, ExternalLink } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const PAGE_SIZE = 10

export default function CaptionsPage() {
  const supabase = createClient()
  const [captions, setCaptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedCaption, setSelectedCaption] = useState<any | null>(null)

  const fetchCaptions = async () => {
    setLoading(true)
    let query = supabase
      .from('captions')
      .select('*, profiles(first_name, last_name, email), images(id, url, image_description)', { count: 'exact' })
    
    if (search) { 
      query = query.ilike('content', `%${search}%`) 
    }

    const { data, count } = await query
      .order('created_datetime_utc', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setCaptions(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchCaptions() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl frutiger-text text-white">Captions</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/40" />
            <input 
              type="text" 
              placeholder="Search content..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
              className="wii-input pl-14" 
            />
          </div>
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/20 border-b border-white/20 text-blue-900/60 text-[10px] font-black uppercase tracking-[0.3em] italic">
                <th className="py-6 px-8">Image</th>
                <th className="py-6 px-8">Caption Content</th>
                <th className="py-6 px-8">Contributor</th>
                <th className="py-6 px-8 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && captions.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-blue-900/50 font-black uppercase text-xs animate-pulse">Retrieving Texts...</td></tr>
              ) : captions.map((cap) => (
                <tr key={cap.id} onClick={() => setSelectedCaption(cap)} className="text-blue-950 hover:bg-white/40 transition-colors cursor-pointer group">
                  <td className="py-4 px-8">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/10 border border-white/40 shadow-sm relative group-hover:scale-110 transition-transform">
                      {cap.images?.url ? <img src={cap.images.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon className="w-4 h-4" /></div>}
                    </div>
                  </td>
                  <td className="py-4 px-8">
                    <p className="text-lg font-black italic text-blue-950 leading-tight line-clamp-1 max-w-xl group-hover:text-blue-600 transition-colors">"{cap.content || 'Untitled'}"</p>
                  </td>
                  <td className="py-4 px-8">
                    <span className="font-bold text-xs uppercase tracking-widest text-blue-900/60">{cap.profiles ? `${cap.profiles.first_name || ''} ${cap.profiles.last_name || ''}`.trim() : 'System'}</span>
                  </td>
                  <td className="py-4 px-8 text-right">
                    {cap.is_featured ? <Star className="w-5 h-5 text-yellow-500 fill-yellow-400 ml-auto drop-shadow-sm" /> : <div className="w-5 h-5 ml-auto border-2 border-white/40 rounded-full" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-8 mt-12">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="glossy-button-secondary !p-4 disabled:opacity-20 shadow-xl"><ChevronLeft className="w-6 h-6" /></button>
          <span className="text-xl font-black text-blue-900 drop-shadow-sm">{page + 1} <span className="text-xs text-blue-900/40 uppercase tracking-widest ml-2">/ {totalPages}</span></span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="glossy-button-secondary !p-4 disabled:opacity-20 shadow-xl"><ChevronRight className="w-6 h-6" /></button>
        </div>
      )}

      <AnimatePresence>
        {selectedCaption && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedCaption(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} onClick={(e) => e.stopPropagation()} className="modal-content !max-w-5xl shadow-[0_50px_150px_rgba(0,0,0,0.4)] border-white/60">
              <button onClick={() => setSelectedCaption(null)} className="absolute top-8 right-8 p-3 bg-white/40 backdrop-blur-xl text-blue-900 rounded-full hover:bg-white/60 transition-all border border-white shadow-xl hover:scale-110 active:scale-90 z-20"><X className="w-6 h-6" /></button>
              <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="w-full md:w-1/2 flex flex-col gap-10">
                  <div className="p-10 bg-white/20 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-inner relative overflow-hidden">
                    <MessageSquare className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-900/5 opacity-10" />
                    <h2 className="text-3xl font-black text-blue-950 italic leading-tight relative z-10 pr-4">"{selectedCaption.content || 'Untitled'}"</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/30 backdrop-blur-sm p-6 rounded-[2rem] border border-white/40 shadow-lg">
                      <p className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest mb-2 italic">Author</p>
                      <p className="font-black text-blue-950 flex items-center gap-3 truncate">{selectedCaption.profiles ? `${selectedCaption.profiles.first_name || ''} ${selectedCaption.profiles.last_name || ''}`.trim() : 'System'}</p>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm p-6 rounded-[2rem] border border-white/40 shadow-lg">
                      <p className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest mb-2 italic">Status</p>
                      {selectedCaption.is_featured ? <p className="font-black text-yellow-600 flex items-center gap-3"><Star className="w-4 h-4 fill-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> Featured</p> : <p className="font-black text-blue-900/40 uppercase text-[10px] tracking-widest">Standard</p>}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col bg-black/5 backdrop-blur-sm p-8 rounded-[3rem] border border-white/20 shadow-inner">
                  <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic"><ImageIcon className="w-5 h-5 text-cyan-500" /> Linked Asset</p>
                  
                  <Link 
                    href={`/images?id=${selectedCaption.images?.id}`}
                    className="flex-1 bg-white/10 rounded-[2rem] overflow-hidden border border-white/20 flex items-center justify-center min-h-[300px] shadow-2xl relative group/img cursor-pointer active:scale-[0.98] transition-all"
                  >
                    {selectedCaption.images?.url ? (
                      <>
                        <img src={selectedCaption.images.url} className="w-full h-full object-contain relative z-10 group-hover/img:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-blue-400/0 group-hover/img:bg-blue-400/10 z-20 transition-colors flex items-center justify-center">
                           <div className="p-4 bg-white/80 backdrop-blur-xl rounded-full shadow-2xl opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <ExternalLink className="w-8 h-8 text-blue-900" />
                           </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-blue-900/20 font-black tracking-widest uppercase text-xs italic">No image found</span>
                    )}
                  </Link>
                  <p className="text-center text-[10px] font-black text-blue-900/40 uppercase tracking-widest mt-4 italic">Click image to manage in Gallery</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
