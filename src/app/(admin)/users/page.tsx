'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Mail, ShieldCheck, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types/database'

const PAGE_SIZE = 10

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      let query = supabase.from('profiles').select('*', { count: 'exact' })
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }
      const { data, count } = await query
        .order('created_datetime_utc', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      
      setUsers(data || [])
      setTotalCount(count || 0)
      setLoading(false)
    }
    const timer = setTimeout(() => { fetchUsers() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl frutiger-text">Users</h1>
          <p className="text-blue-900 font-black tracking-[0.2em] uppercase text-xs italic mt-2">System Profile Management</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900/40" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="wii-input pl-14"
          />
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/20 border-b border-white/20 text-blue-900/60 text-[10px] font-black uppercase tracking-[0.3em] italic">
                <th className="py-6 px-8">Identity</th>
                <th className="py-6 px-8">Email Address</th>
                <th className="py-6 px-8">Privileges</th>
                <th className="py-6 px-8 text-right">Registration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && users.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-blue-900/50 font-black uppercase text-xs animate-pulse">Accessing Records...</td></tr>
              ) : users.map((user) => (
                <tr 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="text-blue-950 hover:bg-white/40 transition-colors cursor-pointer group"
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/60 border border-white text-blue-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="font-black tracking-tight text-lg">
                        {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unnamed User'}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="font-bold text-blue-900/70">{user.email || '—'}</span>
                  </td>
                  <td className="py-6 px-8">
                    {user.is_superadmin ? (
                      <span className="flex items-center gap-1.5 bg-white/60 text-blue-900 text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-white shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-lime-600" />
                        Superadmin
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">Standard</span>
                    )}
                  </td>
                  <td className="py-6 px-8 text-right">
                    <span className="font-black italic text-blue-900/50 text-xs">{new Date(user.created_datetime_utc).toLocaleDateString()}</span>
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
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} onClick={(e) => e.stopPropagation()} className="modal-content !max-w-2xl shadow-[0_50px_150px_rgba(0,0,0,0.3)] border-white/60">
              <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 p-3 bg-white/40 backdrop-blur-xl text-blue-900 rounded-full hover:bg-white/60 transition-all border border-white shadow-xl hover:scale-110 active:scale-90 z-20"><X className="w-6 h-6" /></button>
              <div className="flex items-center gap-8 mb-12 relative z-10">
                <div className="w-24 h-24 rounded-[2rem] bg-white/60 text-blue-900 flex items-center justify-center border border-white shadow-2xl relative"><Users className="w-12 h-12" /></div>
                <div>
                  <h2 className="text-4xl frutiger-text leading-tight">{selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() : 'Unnamed User'}</h2>
                  <p className="text-blue-900/80 font-black tracking-widest uppercase text-xs mt-2 italic">{selectedUser.email || 'No Email Provided'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="bg-white/30 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-inner">
                  <p className="text-[10px] font-black text-blue-900/50 uppercase tracking-[0.3em] mb-2 italic">Global Identifier</p>
                  <p className="font-mono text-xs text-blue-950 bg-black/5 p-4 rounded-2xl border border-white/20 break-all font-black">{selectedUser.id}</p>
                </div>
                <div className="bg-white/30 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-inner">
                  <p className="text-[10px] font-black text-blue-900/50 uppercase tracking-[0.3em] mb-2 italic">System Registration</p>
                  <p className="font-black text-blue-950 bg-white/20 p-4 rounded-2xl border border-white/20 text-center"> {new Date(selectedUser.created_datetime_utc).toLocaleString()} </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
