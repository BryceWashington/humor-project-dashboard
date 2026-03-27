'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Image as ImageIcon, MessageSquare, LogOut, Terminal, 
  Smile, ListTree, Zap, Book, HelpCircle, Cpu, Cloud, Link2, Activity,
  Globe, Mail, FileText
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const sections = [
  {
    label: 'CORE',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'DASHBOARD' },
      { href: '/users', icon: Users, label: 'USERS' },
      { href: '/images', icon: ImageIcon, label: 'IMAGES' },
      { href: '/captions', icon: MessageSquare, label: 'CAPTIONS' },
      { href: '/caption-requests', icon: FileText, label: 'CAPTION_REQS' },
    ]
  },
  {
    label: 'HUMOR',
    items: [
      { href: '/humor-flavors', icon: Smile, label: 'FLAVORS' },
      { href: '/humor-flavor-steps', icon: ListTree, label: 'STEPS' },
      { href: '/humor-mix', icon: Zap, label: 'MIX' },
      { href: '/terms', icon: Book, label: 'GEN-Z_TERMS' },
      { href: '/caption-examples', icon: HelpCircle, label: 'EXAMPLES' },
    ]
  },
  {
    label: 'AI_SYSTEMS',
    items: [
      { href: '/llm-models', icon: Cpu, label: 'MODELS' },
      { href: '/llm-providers', icon: Cloud, label: 'PROVIDERS' },
      { href: '/llm-prompt-chains', icon: Link2, label: 'CHAINS' },
      { href: '/llm-responses', icon: Activity, label: 'RESPONSES' },
    ]
  },
  {
    label: 'ACCESS',
    items: [
      { href: '/signup-domains', icon: Globe, label: 'DOMAINS' },
      { href: '/whitelisted-emails', icon: Mail, label: 'WHITELIST' },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/help', icon: HelpCircle, label: 'HELP' },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="w-64 h-screen p-4 sticky top-0 flex flex-col gap-4 overflow-y-auto no-scrollbar">
      <div className="terminal-card flex-1 flex flex-col p-4 gap-4">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-terminal-accent" />
          <h2 className="text-xl font-bold tracking-tighter text-terminal-fg">DASHBOARD</h2>
        </div>
        
        <div className="border-b border-terminal-border mb-2" />

        <nav className="flex-1 flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="text-[10px] font-black text-terminal-dim tracking-[0.2em] px-3 mb-2">{section.label}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`
                      flex items-center gap-3 px-3 py-1.5 transition-all
                      ${isActive 
                        ? 'bg-terminal-fg text-terminal-bg font-bold' 
                        : 'text-terminal-dim hover:text-terminal-fg hover:bg-white/[0.03]'
                      }
                    `}>
                      <span className="text-[8px] w-2">{isActive ? '>' : ' '}</span>
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-50'}`} />
                      <span className="text-[10px] font-mono tracking-widest">{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-terminal-border pt-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-terminal-dim hover:text-red-500 transition-all font-bold text-[10px] font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            [ LOGOUT ]
          </button>
        </div>
      </div>
    </div>
  )
}
