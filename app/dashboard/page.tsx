'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [plans, setPlans] = useState<any[]>([])
  const [recentPlan, setRecentPlan] = useState<any>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      setUserName(session.user.user_metadata?.name || 'Student')
      await loadDashboardData(session.user.id)
    }
    checkAuth()
  }, [router])

  const loadDashboardData = async (userId: string) => {
    try {
      // 1. Fetch study plans
      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (plansData) {
        setPlans(plansData)
        if (plansData.length > 0) {
          setRecentPlan(plansData[0])
        }
      }

      // 2. Fetch progress to calculate streak
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('videos_completed_at, pyqs_completed_at, practice_completed_at')
        .eq('student_id', userId)

      if (progressData) {
        const dates: number[] = []
        progressData.forEach(row => {
          if (row.videos_completed_at) dates.push(new Date(row.videos_completed_at).setHours(0,0,0,0))
          if (row.pyqs_completed_at) dates.push(new Date(row.pyqs_completed_at).setHours(0,0,0,0))
          if (row.practice_completed_at) dates.push(new Date(row.practice_completed_at).setHours(0,0,0,0))
        })
        
        dates.sort((a, b) => b - a)
        if (dates.length > 0) {
          const uniqueDates = Array.from(new Set(dates))
          const todayMs = new Date().setHours(0,0,0,0)
          const yesterdayMs = todayMs - 86400000
          
          let currentStreak = 0
          let checkDateMs = todayMs
          
          if (uniqueDates[0] === todayMs || uniqueDates[0] === yesterdayMs) {
            if (uniqueDates[0] === yesterdayMs) checkDateMs = yesterdayMs
            for (const d of uniqueDates) {
              if (d === checkDateMs) {
                currentStreak++
                checkDateMs -= 86400000
              } else break
            }
          }
          setStreak(currentStreak)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar userName={userName} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <header>
          <h1 className="text-3xl font-black text-white">Welcome back, {userName}!</h1>
          <p className="text-slate-400 mt-2">Here is an overview of your preparation.</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</h3>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black text-orange-400">{streak}</span>
              <span className="text-lg font-bold text-slate-500 mb-1">Days</span>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Plans</h3>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black text-blue-400">{plans.length}</span>
              <span className="text-lg font-bold text-slate-500 mb-1">Active</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Coach says:</h3>
            <p className="text-sm font-medium text-white mt-4 italic">
              "Consistency is the key to unlocking your full potential. Keep hitting your daily targets!"
            </p>
          </div>
        </div>

        {/* Recently Viewed & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-6">Recently Viewed Plan</h2>
            {recentPlan ? (
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-xl">{recentPlan.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">Goal: {recentPlan.target_score}% | {recentPlan.exam_profile.toUpperCase()}</p>
                  </div>
                  <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-300">
                    {recentPlan.selected_topics.length} topics
                  </span>
                </div>
                <Link 
                  href={`/?planId=${recentPlan.id}`}
                  className="w-full inline-block text-center py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl transition-colors"
                >
                  Continue Learning
                </Link>
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-900/30 rounded-2xl border border-dashed border-white/10">
                <p className="text-slate-400 text-sm mb-4">You don't have any saved study plans yet.</p>
                <Link href="/" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                  Create First Plan
                </Link>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/" className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors group flex flex-col items-center justify-center text-center gap-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">✨</span>
                <span className="font-bold text-sm text-blue-300">Generate New Plan</span>
              </Link>
              <Link href="/plans" className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 hover:border-white/20 transition-colors group flex flex-col items-center justify-center text-center gap-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
                <span className="font-bold text-sm text-slate-300">View All Plans</span>
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
