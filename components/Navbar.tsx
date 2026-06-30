'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <nav className="w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-orange-500 flex items-center justify-center font-black text-white shadow-lg">
                G
              </div>
              <span className="font-bold text-white text-lg tracking-tight hidden sm:block">GoalSlider</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link 
                href="/dashboard"
                className={`text-sm font-bold transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/plans"
                className={`text-sm font-bold transition-colors ${pathname === '/plans' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                My Plans
              </Link>
              <Link 
                href="/"
                className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Create Plan
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-xs font-bold text-slate-400 hidden sm:block">
                Hi, <span className="text-white">{userName}</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
