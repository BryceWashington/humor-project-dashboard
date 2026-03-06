'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Image as ImageIcon, MessageSquare, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/images', icon: ImageIcon, label: 'Images' },
  { href: '/captions', icon: MessageSquare, label: 'Captions' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="w-64 h-screen p-6 sticky top-0 flex flex-col gap-6">
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card flex-1 flex flex-col p-4 gap-2 relative overflow-hidden"
      >
        {/* Glossy Header */}
        <div className="p-4 mb-4 border-b border-white/20">
          <h2 className="frutiger-text text-3xl tracking-tight">Admin</h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-5 py-4 rounded-2xl transition-all
                  ${isActive 
                    ? 'bg-white/40 text-blue-900 font-bold shadow-inner' 
                    : 'text-white/80 hover:bg-white/20 hover:text-white font-medium'
                  }
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-5 py-4 rounded-2xl text-white/70 hover:bg-white/10 transition-all hover:text-red-200 font-bold"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        {/* Ambient Bubbles */}
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </motion.div>
    </div>
  )
}
