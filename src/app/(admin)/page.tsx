'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Users, ImageIcon, MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const StatCard = ({ icon: Icon, label, value, loading }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-8 flex flex-col gap-4 relative overflow-hidden"
  >
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-4 rounded-3xl bg-white/60 border border-white text-blue-900 shadow-sm`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-blue-900 font-black tracking-widest uppercase text-[10px] opacity-70 italic">{label}</p>
      <p className="text-4xl font-black text-blue-950 tracking-tighter mt-1">
        {loading ? '...' : value}
      </p>
    </div>
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rotate-45 translate-x-12 -translate-y-12 blur-2xl pointer-events-none" />
  </motion.div>
)

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ users: 0, images: 0, captions: 0 })
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<{date: string, value: number}[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

      const [
        { count: userCount },
        { count: imageCount },
        { count: captionCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('images').select('*', { count: 'exact', head: true }),
        supabase.from('captions').select('*', { count: 'exact', head: true })
      ])

      setStats({
        users: userCount || 0,
        images: imageCount || 0,
        captions: captionCount || 0
      })

      const [
        { data: recentUsers },
        { data: recentImages },
        { data: recentCaptions }
      ] = await Promise.all([
        supabase.from('profiles').select('created_datetime_utc').gte('created_datetime_utc', thirtyDaysAgoStr),
        supabase.from('images').select('created_datetime_utc').gte('created_datetime_utc', thirtyDaysAgoStr),
        supabase.from('captions').select('created_datetime_utc').gte('created_datetime_utc', thirtyDaysAgoStr)
      ])

      const days: Record<string, { date: string, shortDate: string, users: number, images: number, captions: number }> = {}
      const heatDays: Record<string, number> = {}
      
      for(let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const shortDate = `${d.getMonth()+1}/${d.getDate()}`
        days[dateStr] = { date: dateStr, shortDate, users: 0, images: 0, captions: 0 }
        heatDays[dateStr] = 0
      }

      (recentUsers as any[])?.forEach(u => {
        const dateStr = new Date(u.created_datetime_utc).toISOString().split('T')[0]
        if (days[dateStr]) days[dateStr].users++
      });

      (recentImages as any[])?.forEach(i => {
        const dateStr = new Date(i.created_datetime_utc).toISOString().split('T')[0]
        if (days[dateStr]) days[dateStr].images++
      });

      (recentCaptions as any[])?.forEach(c => {
        const dateStr = new Date(c.created_datetime_utc).toISOString().split('T')[0]
        if (days[dateStr]) {
            days[dateStr].captions++
            heatDays[dateStr]++
        }
      })

      setTimelineData(Object.values(days))
      setHeatmap(Object.entries(heatDays).map(([date, value]) => ({ date, value })))

      const { data: leaderData } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name, 
          last_name,
          email,
          images(count),
          captions(count)
        `)
        .limit(10)

      setLeaderboard((leaderData as any[])?.map(d => {
        const name = `${d.first_name || ''} ${d.last_name || ''}`.trim()
        return {
          id: d.id,
          user: name || d.email || `User_${d.id.substring(0,5)}`,
          images: d.images?.[0]?.count || 0,
          captions: d.captions?.[0]?.count || 0
        }
      }).sort((a, b) => (b.images * 10 + b.captions) - (a.images * 10 + a.captions)).slice(0, 5) || [])

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-5xl frutiger-text">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard icon={Users} label="Total Users" value={stats.users.toLocaleString()} loading={loading} />
        <StatCard icon={ImageIcon} label="Images" value={stats.images.toLocaleString()} loading={loading} />
        <StatCard icon={MessageSquare} label="Captions" value={stats.captions.toLocaleString()} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-10 lg:col-span-2 flex flex-col min-h-[450px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-white/60 rounded-2xl text-blue-900 border border-white shadow-sm"><Activity className="w-6 h-6" /></div>
            <h2 className="frutiger-text text-3xl">30-Day Growth</h2>
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-blue-900/50 font-black tracking-widest uppercase text-xs animate-pulse">Syncing...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fill: '#1e3a8a', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#1e3a8a', fontSize: 10, fontWeight: 900 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px', color: '#1e3a8a' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#00AEEF" strokeWidth={6} dot={false} activeDot={{ r: 8, fill: '#00AEEF', stroke: 'white', strokeWidth: 4 }} />
                  <Line type="monotone" dataKey="images" stroke="#8DC63F" strokeWidth={6} dot={false} activeDot={{ r: 8, fill: '#8DC63F', stroke: 'white', strokeWidth: 4 }} />
                  <Line type="monotone" dataKey="captions" stroke="#00B2B2" strokeWidth={6} dot={false} activeDot={{ r: 8, fill: '#00B2B2', stroke: 'white', strokeWidth: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-10 flex flex-col min-h-[450px]">
          <h2 className="frutiger-text text-2xl mb-2 text-blue-950">Caption Heatmap</h2>
          <div className="flex-1 flex items-center justify-center mt-4">
            {loading ? (
               <div className="text-blue-900/50 font-black tracking-widest uppercase text-xs animate-pulse">Loading...</div>
            ) : (
              <div className="grid grid-cols-5 gap-4 w-full">
                {heatmap.map((d) => (
                  <div key={d.date} className="relative group aspect-square">
                    <motion.div 
                      className="w-full h-full rounded-2xl transition-all border border-white shadow-sm"
                      style={{ 
                        backgroundColor: d.value === 0 ? 'rgba(255,255,255,0.2)' : `rgba(0, 174, 239, ${Math.min(1, 0.2 + (d.value / 8))})`,
                      }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-blue-950 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-2xl">
                      {d.date}: {d.value} captions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-10">
        <h2 className="frutiger-text text-3xl mb-8">Activity Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-blue-900/60 border-b border-blue-900/10 text-[10px] font-black uppercase tracking-[0.3em] italic">
                <th className="pb-6 px-6">Administrator / User</th>
                <th className="pb-6 text-right px-6">Image Contributions</th>
                <th className="pb-6 text-right px-6">Caption Records</th>
                <th className="pb-6 text-right px-6">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/5">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-blue-900/50 font-black tracking-widest uppercase text-xs animate-pulse">Fetching Rankings...</td></tr>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((row) => (
                  <tr key={row.id} className="text-blue-950 hover:bg-white/30 transition-colors group">
                    <td className="py-6 px-6 font-black tracking-tight group-hover:text-blue-600">{row.user}</td>
                    <td className="py-6 text-right px-6 font-mono font-black text-blue-900/70">{row.images}</td>
                    <td className="py-6 text-right px-6 font-mono font-black text-blue-900/70">{row.captions}</td>
                    <td className="py-6 text-right px-6">
                      <span className="bg-white/60 text-blue-900 px-6 py-2.5 rounded-full text-xs font-black border border-white shadow-sm group-hover:shadow-md transition-all">
                        {row.images * 10 + row.captions}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-12 text-center text-blue-900/50 italic font-black uppercase tracking-widest text-xs">Data not available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
