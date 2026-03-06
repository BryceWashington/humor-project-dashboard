'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Trash2, Edit2, ImageIcon, Search, ExternalLink, X, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Image as DBImage } from '@/types/database'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10

export default function ImagesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const imageIdFilter = searchParams.get('id')

  const [images, setImages] = useState<DBImage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedImage, setSelectedImage] = useState<DBImage | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingImage, setEditingImage] = useState<DBImage | null>(null)
  
  const [formData, setFormData] = useState({ url: '', image_description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchImages = async () => {
    setLoading(true)
    let query = supabase.from('images').select('*, profiles(first_name, last_name, email)', { count: 'exact' })
    
    if (imageIdFilter) {
      query = query.eq('id', imageIdFilter)
    } else if (search) {
      query = query.ilike('image_description', `%${search}%`)
    }

    const { data, count } = await query
      .order('created_datetime_utc', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    
    setImages(data as any || [])
    setTotalCount(count || 0)
    setLoading(false)
    
    // Auto-select if directed from captions
    if (imageIdFilter && data?.[0]) {
      setSelectedImage(data[0] as any)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchImages() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, imageIdFilter])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this asset?')) return
    await supabase.from('images').delete().eq('id', id)
    fetchImages()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (editingImage) {
      await supabase.from('images').update({ url: formData.url, image_description: formData.image_description }).eq('id', editingImage.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('images').insert({ url: formData.url, image_description: formData.image_description, is_public: true, profile_id: user?.id })
    }
    setIsSubmitting(false); setIsAdding(false); setEditingImage(null);
    setFormData({ url: '', image_description: '' }); fetchImages();
  }

  const openEdit = (e: React.MouseEvent, img: DBImage) => {
    e.stopPropagation(); setEditingImage(img);
    setFormData({ url: img.url || '', image_description: img.image_description || '' });
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl frutiger-text">Images</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/40" />
            <input type="text" placeholder="Search descriptions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="wii-input pl-14" />
          </div>
          <button onClick={() => setIsAdding(true)} className="glossy-button flex items-center justify-center gap-3 !from-lime-400 !to-lime-600 shadow-xl whitespace-nowrap"><PlusCircle className="w-6 h-6" />Add Image</button>
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/20 border-b border-white/20 text-blue-900/60 text-[10px] font-black uppercase tracking-[0.3em] italic">
                <th className="py-6 px-8">Preview</th>
                <th className="py-6 px-8">Description</th>
                <th className="py-6 px-8">Contributor</th>
                <th className="py-6 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && images.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-blue-900/50 font-black uppercase text-xs animate-pulse">Scanning Assets...</td></tr>
              ) : images.map((img) => (
                <tr key={img.id} onClick={() => setSelectedImage(img)} className="text-blue-950 hover:bg-white/40 transition-colors cursor-pointer group">
                  <td className="py-4 px-8">
                    <div className="w-20 aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/40 shadow-sm relative">
                      {img.url ? <img src={img.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-black opacity-30 uppercase">No Data</div>}
                    </div>
                  </td>
                  <td className="py-4 px-8">
                    <p className="text-sm font-black italic text-blue-900/80 leading-relaxed line-clamp-2 max-w-md">{img.image_description || 'No description provided.'}</p>
                  </td>
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(141,198,63,0.8)]" />
                      <span className="font-bold text-xs uppercase tracking-wider text-blue-900/60">{img.profiles ? `${img.profiles.first_name || ''} ${img.profiles.last_name || ''}`.trim() : 'System'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => openEdit(e, img)} className="p-2.5 bg-white/60 rounded-xl text-blue-900 border border-white shadow-sm hover:scale-110 transition-transform"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(e, img.id)} className="p-2.5 bg-white/60 rounded-xl text-red-600 border border-white shadow-sm hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} onClick={(e) => e.stopPropagation()} className="modal-content !max-w-5xl shadow-[0_50px_150px_rgba(0,0,0,0.4)] border-white/60">
              <button onClick={() => setSelectedImage(null)} className="absolute top-8 right-8 p-3 bg-white/40 backdrop-blur-xl text-blue-900 rounded-full hover:bg-white/60 transition-all border border-white shadow-xl hover:scale-110 active:scale-90 z-20"><X className="w-6 h-6" /></button>
              <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="w-full md:w-3/5 bg-black/20 rounded-[2rem] overflow-hidden border border-white/40 flex items-center justify-center min-h-[400px] shadow-2xl relative">
                  {selectedImage.url ? <img src={selectedImage.url} className="w-full h-full object-contain" /> : <span className="text-white/30 font-black uppercase text-xs">No Resource</span>}
                </div>
                <div className="w-full md:w-2/5 flex flex-col justify-center space-y-10">
                  <div>
                    <h2 className="text-[10px] font-black text-blue-900/50 uppercase tracking-[0.4em] mb-4 flex items-center gap-3 italic"><div className="w-2.5 h-2.5 rounded-full bg-lime-400 border border-white" />Asset Description</h2>
                    <p className="text-sm font-black text-blue-950 leading-relaxed italic pr-6">{selectedImage.image_description || 'No detailed meta-data provided.'}</p>
                  </div>
                  <div className="space-y-6 bg-white/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-inner">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-white/60 rounded-2xl shadow-xl flex items-center justify-center border border-white"><User className="w-7 h-7 text-blue-900" /></div>
                       <div>
                          <p className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest mb-1 italic">Contributor</p>
                          <p className="font-black text-blue-950 text-sm">{selectedImage.profiles ? `${selectedImage.profiles.first_name || ''} ${selectedImage.profiles.last_name || ''}`.trim() : 'System'}</p>
                       </div>
                    </div>
                    <div><p className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest mb-2 italic">Full Source</p><a href={selectedImage.url} target="_blank" className="glossy-button-secondary !py-4 w-full flex items-center justify-center gap-3 text-[10px] font-black tracking-widest shadow-2xl">VIEW RESOURCE <ExternalLink className="w-4 h-4 opacity-70" /></a></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAdding || editingImage) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="modal-content !max-w-md shadow-2xl border-white/60">
              <button onClick={() => { setIsAdding(false); setEditingImage(null); }} className="absolute top-8 right-8 p-3 bg-white/20 text-blue-900 rounded-full hover:bg-white/40 transition-all border border-white/50 shadow-xl hover:scale-110"><X className="w-5 h-5" /></button>
              <h2 className="text-4xl frutiger-text mb-10 flex items-center gap-4"><div className="w-4 h-4 bg-lime-400 rounded-full border border-white" />{editingImage ? 'Modify' : 'New'} Asset</h2>
              <form onSubmit={handleSave} className="space-y-8 relative z-10">
                <div><label className="block text-[10px] font-black text-blue-900/50 uppercase tracking-[0.3em] mb-3 ml-2 italic">Resource URL</label><input type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="wii-input" /></div>
                <div><label className="block text-[10px] font-black text-blue-900/50 uppercase tracking-[0.3em] mb-3 ml-2 italic">Description</label><textarea rows={4} value={formData.image_description} onChange={e => setFormData({...formData, image_description: e.target.value})} className="wii-input resize-none" /></div>
                <div className="pt-6 flex justify-end gap-4">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingImage(null); }} className="glossy-button-secondary !py-4 !px-8">Discard</button>
                  <button type="submit" disabled={isSubmitting} className="glossy-button !from-lime-400 !to-lime-600 shadow-2xl !py-4 !px-10 min-w-[140px]">{isSubmitting ? '...' : 'Save'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
