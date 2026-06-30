'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function MyPlans() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [plans, setPlans] = useState<any[]>([])
  const [progressData, setProgressData] = useState<Record<string, number>>({})
  
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      setUserName(session.user.user_metadata?.name || 'Student')
      await loadPlans(session.user.id)
    }
    checkAuth()
  }, [router])

  const loadPlans = async (userId: string) => {
    try {
      // 1. Fetch study plans
      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
      
      // 2. Fetch progress to calculate percentages
      const { data: progressRowData } = await supabase
        .from('student_progress')
        .select('plan_id, videos_done, pyqs_done, practice_done')
        .eq('student_id', userId)

      const progressMap: Record<string, number> = {}
      
      if (plansData && progressRowData) {
        plansData.forEach(plan => {
          const totalSubtasks = (plan.selected_topics?.length || 0) * 3
          let completed = 0
          
          progressRowData.forEach(row => {
            if (row.plan_id === plan.id) {
              if (row.videos_done) completed++
              if (row.pyqs_done) completed++
              if (row.practice_done) completed++
            }
          })
          
          progressMap[plan.id] = totalSubtasks > 0 ? Math.round((completed / totalSubtasks) * 100) : 0
        })
      }

      setPlans(plansData || [])
      setProgressData(progressMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this study plan? All progress will be lost.')) return
    
    // Optimistic UI update
    setPlans(prev => prev.filter(p => p.id !== planId))
    
    try {
      await supabase.from('study_plans').delete().eq('id', planId)
    } catch (e) {
      console.error('Failed to delete plan', e)
    }
  }

  const filteredAndSortedPlans = useMemo(() => {
    let result = [...plans]
    
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(s) || p.exam_profile.toLowerCase().includes(s))
    }
    
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'highest') return b.target_score - a.target_score
      return 0
    })
    
    return result
  }, [plans, search, sortBy])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Plans...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar userName={userName} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white">My Study Plans</h1>
            <p className="text-slate-400 mt-2">Manage and continue your saved roadmaps.</p>
          </div>
          <Link href="/" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shrink-0 text-center">
            + New Plan
          </Link>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search plans by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              <option value="newest" className="bg-slate-900">Newest First</option>
              <option value="oldest" className="bg-slate-900">Oldest First</option>
              <option value="highest" className="bg-slate-900">Highest Target</option>
            </select>
          </div>
        </div>

        {/* Plans Grid */}
        {filteredAndSortedPlans.length === 0 ? (
          <div className="text-center p-12 glass-panel rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-400 mb-4">No plans found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedPlans.map((plan) => (
              <div key={plan.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-white text-xl truncate pr-4">{plan.title}</h3>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 uppercase">
                      {plan.exam_profile}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      Goal: {plan.target_score}%
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {plan.selected_topics?.length || 0} Topics
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-emerald-400">{progressData[plan.id] || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 transition-all" style={{ width: `${progressData[plan.id] || 0}%` }} />
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mb-6">
                    Last updated: {new Date(plan.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2 border-t border-white/5 pt-4">
                  <Link 
                    href={`/?planId=${plan.id}`}
                    className="flex-1 text-center py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg transition-colors text-sm"
                  >
                    Continue
                  </Link>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors group-hover:opacity-100 opacity-50 text-sm"
                    title="Delete Plan"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
