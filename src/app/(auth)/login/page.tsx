'use client'

import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { LogIn, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f1f5f9] fixed inset-0">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00b0f0]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8DC63F]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card w-full max-w-md p-12 text-center relative shadow-[0_30px_100px_rgba(0,176,240,0.15)]"
      >
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#e0f4fc] to-white rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/50">
            <LogIn className="w-10 h-10 text-[#00b0f0] drop-shadow-sm" />
          </div>

          <h1 className="text-4xl frutiger-text text-gray-800 mb-2">System Access</h1>
          <p className="text-gray-500 font-black tracking-widest uppercase text-[10px] mb-10 opacity-60 italic">Humor Project Administration</p>

          {error === 'unauthorized' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50/80 backdrop-blur-md text-red-600 border border-red-200 rounded-2xl p-6 mb-8 flex flex-col items-center gap-3 w-full shadow-lg"
            >
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="text-lg font-black tracking-tight">ACCESS DENIED</div>
              <div className="text-sm font-bold text-red-500/80 leading-tight italic">Your account does not have Super Admin privileges.</div>
            </motion.div>
          )}
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingOut}
            className="glossy-button w-full flex items-center justify-center gap-4 text-xl py-4"
          >
            {isLoggingOut ? 'Clearing Session...' : 'Sign in with Google'}
          </button>
          
          <div className="mt-12 pt-8 border-t border-gray-100/50 text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60 italic">
            Strictly Restricted to Super Admins
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="w-16 h-16 border-4 border-white/20 border-t-[#00b0f0] rounded-full animate-spin shadow-lg" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
