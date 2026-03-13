'use client'

import { createClient } from '@/utils/supabase/client'
import { LogIn, AlertCircle, ShieldCheck, Terminal as TerminalIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [bootSequence, setBootSequence] = useState<string[]>([])

  useEffect(() => {
    const lines = [
      '> INITIALIZING BOOT SEQUENCE...',
      '> CHECKING SYSTEM INTEGRITY...',
      '> LOADING SECURITY PROTOCOLS...',
      '> ESTABLISHING ENCRYPTED LINK...',
      '> READY FOR AUTHENTICATION.'
    ]
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        setBootSequence(prev => [...prev, lines[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 400)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (error === 'unauthorized') {
      setIsLoggingOut(true)
      supabase.auth.signOut().then(() => {
        setIsLoggingOut(false)
      })
    }
  }, [error, supabase.auth])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        }
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-terminal-bg fixed inset-0 font-mono text-terminal-fg">
      <div className="terminal-card w-full max-w-lg p-8 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-8 border-b border-terminal-border pb-4">
          <TerminalIcon className="w-6 h-6 text-terminal-accent" />
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Access Terminal</h1>
        </div>

        {error === 'unauthorized' && (
          <div className="border border-red-500 bg-red-950/20 text-red-500 p-6 mb-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold uppercase">
              <AlertCircle className="w-5 h-5" />
              ACCESS_DENIED
            </div>
            <div className="text-xs font-mono">
              SUPER_ADMIN_PRIVILEGE_REQUIRED
            </div>
          </div>
        )}
        
        <div className="space-y-6">
            <button 
                onClick={handleLogin}
                disabled={isLoggingOut}
                className="terminal-button-accent w-full justify-center text-lg py-4 group"
            >
                <ShieldCheck className="w-6 h-6 group-hover:animate-pulse" />
                {isLoggingOut ? '[ PROCESSING... ]' : '[ AUTHENTICATE_VIA_GOOGLE ]'}
            </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-terminal-bg font-mono">
        <div className="text-terminal-green animate-pulse font-bold tracking-[0.5em]">SYSTEM_BOOTING...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
