'use client'

import { useEffect, useState, Suspense } from 'react'
import { Users, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types/database'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10

function UsersContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const userIdFilter = searchParams.get('id')

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
      
      if (userIdFilter) {
        query = query.eq('id', userIdFilter)
      } else if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, count } = await query
        .order('created_datetime_utc', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      
      setUsers(data || [])
      setTotalCount(count || 0)
      setLoading(false)

      if (userIdFilter && data?.[0]) {
        setSelectedUser(data[0])
      }
    }
    const timer = setTimeout(() => { fetchUsers() }, 300)
    return () => clearTimeout(timer)
  }, [supabase, search, page, userIdFilter])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">System Directory [READ_ONLY]</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">User Registry</h1>
        </div>
        <div className="relative w-full md:w-96">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim text-[10px] tracking-widest font-bold">QUERY:</div>
          <input 
            type="text" 
            placeholder="FILTER_BY_IDENTITY..." 
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
                <th className="px-4 w-1/3">NAME / IDENTITY</th>
                <th className="px-4 w-1/3">EMAIL_ADDR</th>
                <th className="px-4 w-32">PRVLGS</th>
                <th className="px-4 text-right w-32">REG_DATE</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim animate-pulse">[ ACCESSING_RECORDS... ]</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-terminal-dim">[ NO_RECORDS_FOUND ]</td></tr>
              ) : users.map((user) => (
                <tr 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-dim font-bold text-xs">{'>'}</span>
                      <span className="font-bold tracking-tight truncate">
                        {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim().toUpperCase() : 'NULL_USER'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-terminal-dim truncate block">{user.email || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_superadmin ? (
                      <span className="bg-terminal-accent text-terminal-bg text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest">
                        SUPER_ADMIN
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-terminal-dim uppercase tracking-widest">STANDARD</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className="text-terminal-dim">{new Date(user.created_datetime_utc).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 border-t border-terminal-border pt-6">
          <div className="text-[10px] text-terminal-dim uppercase font-bold">
            RECORDS: {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} OF {totalCount}
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0} 
                className="terminal-button !py-1 !px-2 disabled:opacity-20"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase">PAGE {page + 1} / {totalPages}</span>
            <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page === totalPages - 1} 
                className="terminal-button !py-1 !px-2 disabled:opacity-20"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="terminal-card w-full max-w-2xl !p-0 border border-terminal-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-header border-b border-terminal-border text-terminal-fg p-3 flex justify-between items-center px-4 font-bold">
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
                <Users className="w-3 h-3 text-terminal-accent" />
                User Profile
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-terminal-dim hover:text-terminal-fg transition-colors">
                [X]
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex items-start gap-6 border-b border-terminal-border pb-8">
                <div className="w-20 h-20 border border-terminal-border flex items-center justify-center bg-terminal-header">
                  <Users className="w-10 h-10 text-terminal-dim" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold uppercase tracking-tighter text-terminal-fg">
                    {selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() : 'NULL_USER'}
                  </h2>
                  <p className="text-terminal-dim text-xs font-bold uppercase tracking-widest">{selectedUser.email || 'NO_EMAIL_RECORD'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-terminal-border p-4 bg-terminal-header space-y-2">
                  <p className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest">GLOBAL_UID</p>
                  <p className="font-mono text-[10px] break-all text-terminal-fg">{selectedUser.id}</p>
                </div>
                <div className="border border-terminal-border p-4 bg-terminal-header space-y-2">
                  <p className="text-[10px] font-bold text-terminal-dim uppercase tracking-widest">REGISTRATION</p>
                  <p className="font-bold text-xs text-terminal-fg uppercase"> {new Date(selectedUser.created_datetime_utc).toLocaleString()} </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="terminal-button"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-mono">
        <div className="text-terminal-dim animate-pulse font-bold tracking-[0.2em]">[ ACCESSING_USER_REGISTRY... ]</div>
      </div>
    }>
      <UsersContent />
    </Suspense>
  )
}
