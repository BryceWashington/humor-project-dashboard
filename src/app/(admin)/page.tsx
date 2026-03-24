'use client'

import { useEffect, useState } from 'react'
import { Activity, Users, ImageIcon, MessageSquare, Database, Cpu } from 'lucide-react'
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
  <div className="terminal-card flex flex-col gap-2">
    <div className="flex justify-between items-center mb-2">
      <div className="terminal-header flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
    </div>
    <div className="text-3xl font-bold font-mono tracking-widest text-terminal-fg">
      {loading ? '[ SYNCING... ]' : value}
    </div>
    <div className="mt-2 h-[1px] bg-terminal-border w-full">
        {!loading && <div className="h-full bg-terminal-accent w-3/4" />}
    </div>
  </div>
)

export default function Dashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState({ users: 0, images: 0, captions: 0 })
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [heatmap, setHeatmap] = useState<{date: string, value: number}[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
          images!profile_id(count),
          captions!profile_id(count)
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
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex justify-between items-end border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">System Monitor</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-terminal-fg uppercase">Dashboard Summary</h1>
        </div>
        <div className="text-right">
            <p className="text-xs text-terminal-dim">TIME: {mounted ? new Date().toISOString() : '[ CONNECTING... ]'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} label="DATABASE_USERS" value={stats.users.toLocaleString()} loading={loading} />
        <StatCard icon={ImageIcon} label="IMAGE_ASSETS" value={stats.images.toLocaleString()} loading={loading} />
        <StatCard icon={MessageSquare} label="CAPTION_RECORDS" value={stats.captions.toLocaleString()} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="terminal-card lg:col-span-2 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="terminal-header flex items-center gap-2">
              <Activity className="w-4 h-4" />
              SYSTEM_GROWTH_TIMELINE
            </div>
          </div>
          <div className="flex-1 w-full bg-black/40 border border-terminal-border/50 p-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-terminal-dim text-xs animate-pulse font-bold tracking-widest">[ SYNCING DATA STREAM... ]</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis dataKey="shortDate" axisLine={{ stroke: '#27272a' }} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={{ stroke: '#27272a' }} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', color: '#f4f4f5', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#00ff41' }}
                  />
                  <Line type="step" dataKey="users" stroke="#00ff41" strokeWidth={1} dot={false} />
                  <Line type="step" dataKey="images" stroke="#f4f4f5" strokeWidth={1} dot={false} />
                  <Line type="step" dataKey="captions" stroke="#71717a" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="terminal-card flex flex-col min-h-[400px]">
          <div className="terminal-header mb-4">CAPTION_ACTIVITY_GRID</div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {loading ? (
               <div className="text-terminal-dim text-xs animate-pulse font-bold">[ LOADING_GRID ]</div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-2 w-full">
                  {heatmap.map((d) => (
                    <div key={d.date} className="relative group aspect-square">
                      <div 
                        className="w-full h-full border border-terminal-border/40 transition-all"
                        style={{ 
                          backgroundColor: d.value === 0 ? 'transparent' : `rgba(0, 255, 65, ${Math.min(1, 0.2 + (d.value / 8))})`,
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-terminal-fg text-terminal-bg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border border-terminal-bg">
                        [{d.date}] :: {d.value} CAPS
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-full text-[10px] text-terminal-dim border-t border-terminal-border pt-4 font-mono">
                  LEGEND: MIN (DARK) - MAX (ACCENT)
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="terminal-card">
        <div className="flex items-center justify-between mb-6">
            <div className="terminal-header flex items-center gap-2">
                <Database className="w-4 h-4" />
                USER_ENGAGEMENT_RANKINGS
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th>IDENTIFIER / USER_ID</th>
                <th className="text-right">IMG_COUNT</th>
                <th className="text-right">CAP_COUNT</th>
                <th className="text-right">W_SCORE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-terminal-dim animate-pulse">[ FETCHING_RANKINGS ]</td></tr>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((row) => (
                  <tr key={row.id}>
                    <td className="font-bold tracking-tight text-terminal-fg">{row.user}</td>
                    <td className="text-right text-terminal-dim">{row.images}</td>
                    <td className="text-right text-terminal-dim">{row.captions}</td>
                    <td className="text-right font-bold text-terminal-accent">
                        {(row.images * 10 + row.captions).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-8 text-center text-terminal-dim">[ NO_DATA_AVAILABLE ]</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
