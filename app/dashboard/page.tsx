'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Topic {
  id: string
  name: string
  category: string
  pyqFrequency: number
  marksWeightageGovt: number
  marksWeightagePlacement: number
  difficulty: number
  studentWeakness: number
  videos: number
  pyqs: number
  practice: number
  notes: number
  studyMinutes: number
  syllabusWeight: number
}

const fallbackTopics: Topic[] = [
  { id: 't1', name: 'Quantitative Aptitude: Percentages & Interest', category: 'Quantitative Aptitude', pyqFrequency: 10, marksWeightageGovt: 14, marksWeightagePlacement: 10, difficulty: 3, studentWeakness: 3, videos: 5, pyqs: 25, practice: 40, notes: 6, studyMinutes: 120, syllabusWeight: 10 },
  { id: 't2', name: 'Quantitative Aptitude: Time, Speed & Distance', category: 'Quantitative Aptitude', pyqFrequency: 8, marksWeightageGovt: 12, marksWeightagePlacement: 8, difficulty: 6, studentWeakness: 5, videos: 4, pyqs: 18, practice: 30, notes: 5, studyMinutes: 110, syllabusWeight: 9 },
  { id: 't3', name: 'Data Interpretation: Charts & Tables', category: 'Quantitative Aptitude', pyqFrequency: 9, marksWeightageGovt: 15, marksWeightagePlacement: 12, difficulty: 5, studentWeakness: 4, videos: 4, pyqs: 22, practice: 35, notes: 4, studyMinutes: 90, syllabusWeight: 11 },
  { id: 't4', name: 'Logical Reasoning: Syllogisms & Arrangements', category: 'Logical Reasoning', pyqFrequency: 9, marksWeightageGovt: 13, marksWeightagePlacement: 10, difficulty: 4, studentWeakness: 6, videos: 4, pyqs: 20, practice: 30, notes: 5, studyMinutes: 95, syllabusWeight: 10 },
  { id: 't5', name: 'Logical Reasoning: Coding-Decoding & Series', category: 'Logical Reasoning', pyqFrequency: 10, marksWeightageGovt: 10, marksWeightagePlacement: 8, difficulty: 2, studentWeakness: 2, videos: 3, pyqs: 28, practice: 45, notes: 4, studyMinutes: 70, syllabusWeight: 8 },
  { id: 't6', name: 'Verbal Ability: Reading Comprehension', category: 'Verbal & English', pyqFrequency: 7, marksWeightageGovt: 12, marksWeightagePlacement: 10, difficulty: 5, studentWeakness: 4, videos: 3, pyqs: 15, practice: 25, notes: 5, studyMinutes: 80, syllabusWeight: 10 },
  { id: 't7', name: 'Verbal Ability: Error Spotting & Grammar', category: 'Verbal & English', pyqFrequency: 8, marksWeightageGovt: 8, marksWeightagePlacement: 6, difficulty: 3, studentWeakness: 5, videos: 3, pyqs: 16, practice: 30, notes: 4, studyMinutes: 65, syllabusWeight: 7 },
  { id: 't8', name: 'Technical: Data Structures & Algorithms', category: 'Technical Core', pyqFrequency: 8, marksWeightageGovt: 2, marksWeightagePlacement: 22, difficulty: 7, studentWeakness: 8, videos: 9, pyqs: 30, practice: 50, notes: 10, studyMinutes: 240, syllabusWeight: 18 },
  { id: 't9', name: 'Technical: Database Systems (DBMS) & SQL', category: 'Technical Core', pyqFrequency: 6, marksWeightageGovt: 4, marksWeightagePlacement: 12, difficulty: 4, studentWeakness: 4, videos: 4, pyqs: 15, practice: 25, notes: 6, studyMinutes: 100, syllabusWeight: 10 },
  { id: 't10', name: 'General Awareness: Economy & Current Affairs', category: 'General Knowledge', pyqFrequency: 9, marksWeightageGovt: 10, marksWeightagePlacement: 2, difficulty: 5, studentWeakness: 6, videos: 5, pyqs: 30, practice: 40, notes: 8, studyMinutes: 110, syllabusWeight: 9 }
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  // Plans & active plan state
  const [plans, setPlans] = useState<any[]>([])
  const [activePlan, setActivePlan] = useState<any>(null)
  
  // Topics & progress loaded from DB
  const [dbTopics, setDbTopics] = useState<Topic[]>([])
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})
  const [taskCompletionDates, setTaskCompletionDates] = useState<Record<string, string>>({})
  const [streak, setStreak] = useState(0)
  
  // Weaknesses
  const [weaknesses, setWeaknesses] = useState<Record<string, number>>({})

  // Resolve topics
  const topics = useMemo(() => {
    const list = dbTopics.length > 0 ? dbTopics : fallbackTopics
    return list.map(t => {
      const w = weaknesses[t.id]
      return w !== undefined ? { ...t, studentWeakness: w } : t
    })
  }, [dbTopics, weaknesses])

  // Get active exam target weightage
  const getTopicMarks = useCallback((topic: Topic, profile: string) => {
    return profile === 'govt' ? topic.marksWeightageGovt : topic.marksWeightagePlacement
  }, [])

  // Calculate scores to rank
  const calculateTopicScore = useCallback((topic: Topic, profile: string) => {
    const normDiff = 10 - topic.difficulty
    const marks = getTopicMarks(topic, profile)
    return (topic.pyqFrequency * 0.4) + (marks * 0.3) + (normDiff * 0.1) + (topic.studentWeakness * 0.2)
  }, [getTopicMarks])

  // Re-run the recommendation selector to get the exact selected topics list for this plan
  const selectedTopics = useMemo(() => {
    if (!activePlan) return []
    const profile = activePlan.exam_profile
    const goal = activePlan.target_score
    const overrides = activePlan.selected_topics?.manualOverrides || {}

    const sorted = [...topics].sort((a, b) => calculateTopicScore(b, profile) - calculateTopicScore(a, profile))
    const selectedIds = new Set<string>()
    const totalMarksPossible = topics.reduce((sum, t) => sum + getTopicMarks(t, profile), 0)
    const targetMarks = (goal / 100) * totalMarksPossible

    Object.entries(overrides).forEach(([id, included]) => {
      if (included) selectedIds.add(id)
    })

    let currentMarks = topics
      .filter(t => selectedIds.has(t.id) && overrides[t.id] !== false)
      .reduce((sum, t) => sum + getTopicMarks(t, profile), 0)

    for (const topic of sorted) {
      if (currentMarks >= targetMarks) break
      if (overrides[topic.id] === false) continue
      if (!selectedIds.has(topic.id)) {
        selectedIds.add(topic.id)
        currentMarks += getTopicMarks(topic, profile)
      }
    }

    return topics.filter(t => selectedIds.has(t.id))
  }, [activePlan, topics, calculateTopicScore, getTopicMarks])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      setUser(session.user)
      setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student')
      await loadDashboardData(session.user.id)
    }
    checkAuth()
  }, [router])

  const loadDashboardData = async (userId: string) => {
    try {
      // 1. Fetch Topics from DB
      const { data: topicsData } = await supabase.from('topics').select('*')
      if (topicsData && topicsData.length > 0) {
        setDbTopics(topicsData.map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          pyqFrequency: t.pyq_frequency,
          marksWeightageGovt: t.marks_weightage_govt,
          marksWeightagePlacement: t.marks_weightage_placement,
          difficulty: t.difficulty,
          studentWeakness: 5,
          videos: t.videos,
          pyqs: t.pyqs,
          practice: t.practice,
          notes: t.notes,
          studyMinutes: t.study_minutes,
          syllabusWeight: t.syllabus_weight
        })))
      }

      // 2. Fetch weaknesses
      const { data: weaknessData } = await supabase.from('student_weakness').select('*').eq('student_id', userId)
      if (weaknessData) {
        const weakMap: Record<string, number> = {}
        weaknessData.forEach((w: any) => { weakMap[w.topic_id] = w.weakness_score })
        setWeaknesses(weakMap)
      }

      // 3. Fetch study plans
      const { data: plansData } = await supabase
        .from('study_plans')
        .select('*')
        .order('updated_at', { ascending: false })
      
      let currentActivePlan = null
      if (plansData) {
        setPlans(plansData)
        if (plansData.length > 0) {
          currentActivePlan = plansData[0]
          setActivePlan(plansData[0])
        }
      }

      // 4. Fetch progress and calculate streak
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', userId)

      if (progressData) {
        // Streak calculation
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

        // Map progress specific to active plan
        if (currentActivePlan) {
          const activeProgress = progressData.filter(r => r.plan_id === currentActivePlan.id)
          const tasks: Record<string, boolean> = {}
          const datesMap: Record<string, string> = {}
          activeProgress.forEach(row => {
            if (row.videos_done) { tasks[`${row.topic_id}-vid`] = true; datesMap[`${row.topic_id}-vid`] = row.videos_completed_at }
            if (row.pyqs_done) { tasks[`${row.topic_id}-pyq`] = true; datesMap[`${row.topic_id}-pyq`] = row.pyqs_completed_at }
            if (row.practice_done) { tasks[`${row.topic_id}-practice`] = true; datesMap[`${row.topic_id}-practice`] = row.practice_completed_at }
          })
          setCompletedTasks(tasks)
          setTaskCompletionDates(datesMap)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Handle plan switching
  const handleSelectPlan = async (plan: any) => {
    setActivePlan(plan)
    // Reload progress for selected plan
    if (user) {
      const { data } = await supabase.from('student_progress').select('*').eq('plan_id', plan.id)
      const tasks: Record<string, boolean> = {}
      const datesMap: Record<string, string> = {}
      if (data) {
        data.forEach(row => {
          if (row.videos_done) { tasks[`${row.topic_id}-vid`] = true; datesMap[`${row.topic_id}-vid`] = row.videos_completed_at }
          if (row.pyqs_done) { tasks[`${row.topic_id}-pyq`] = true; datesMap[`${row.topic_id}-pyq`] = row.pyqs_completed_at }
          if (row.practice_done) { tasks[`${row.topic_id}-practice`] = true; datesMap[`${row.topic_id}-practice`] = row.practice_completed_at }
        })
      }
      setCompletedTasks(tasks)
      setTaskCompletionDates(datesMap)
    }
  }

  // Handle checkbox toggles
  const handleToggleTask = async (taskId: string) => {
    if (!user || !activePlan) return
    const newValue = !completedTasks[taskId]
    
    // Update local state
    setCompletedTasks(prev => ({ ...prev, [taskId]: newValue }))
    const nowStr = new Date().toISOString()
    setTaskCompletionDates(prev => {
      const updated = { ...prev }
      if (newValue) updated[taskId] = nowStr
      else delete updated[taskId]
      return updated
    })

    // Parse topicId and type
    const parts = taskId.split('-')
    const type = parts.pop() || ''
    const topicId = parts.join('-')

    const col = type === 'vid' ? 'videos_done' : type === 'pyq' ? 'pyqs_done' : 'practice_done'
    const dateCol = type === 'vid' ? 'videos_completed_at' : type === 'pyq' ? 'pyqs_completed_at' : 'practice_completed_at'

    try {
      await supabase.from('student_progress').upsert({
        student_id: user.id,
        plan_id: activePlan.id,
        topic_id: topicId,
        [col]: newValue,
        [dateCol]: newValue ? nowStr : null,
        updated_at: nowStr
      }, { onConflict: 'plan_id,topic_id' })
      
      // Update plan timestamp
      await supabase.from('study_plans').update({ updated_at: nowStr }).eq('id', activePlan.id)
    } catch (e) {
      console.error(e)
    }
  }

  // --- Dynamic Dashboard Metrics & Stats ---
  const stats = useMemo(() => {
    const totalSubtasks = selectedTopics.length * 3
    const completedSubtasks = Object.keys(completedTasks).filter(k => {
      const topicId = k.split('-')[0]
      return selectedTopics.some(t => t.id === topicId) && completedTasks[k]
    }).length
    
    const percentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
    const remainingSubtasks = totalSubtasks - completedSubtasks

    const completedTopics = selectedTopics.filter(t => 
      completedTasks[`${t.id}-vid`] && completedTasks[`${t.id}-pyq`] && completedTasks[`${t.id}-practice`]
    )

    // Readiness score combines target score and completion rate
    const targetVal = activePlan ? activePlan.target_score : 0
    const readiness = Math.round(percentage * (targetVal / 100))

    return {
      totalSubtasks,
      completedSubtasks,
      remainingSubtasks,
      percentage,
      completedTopicsCount: completedTopics.length,
      remainingTopicsCount: selectedTopics.length - completedTopics.length,
      readiness,
      completedTopics
    }
  }, [selectedTopics, completedTasks, activePlan])

  // Today's Plan: Filter first 2 topics that are NOT completed
  const todaysPlanTopics = useMemo(() => {
    return selectedTopics.filter(t => {
      const done = completedTasks[`${t.id}-vid`] && completedTasks[`${t.id}-pyq`] && completedTasks[`${t.id}-practice`]
      return !done
    }).slice(0, 2)
  }, [selectedTopics, completedTasks])

  // Next Recommended Module: Pick the highest priority uncompleted topic
  const nextRecommended = useMemo(() => {
    return selectedTopics.find(t => {
      const done = completedTasks[`${t.id}-vid`] && completedTasks[`${t.id}-pyq`] && completedTasks[`${t.id}-practice`]
      return !done
    })
  }, [selectedTopics, completedTasks])

  // AI Suggestions feed
  const aiSuggestions = useMemo(() => {
    const suggestions = []
    if (activePlan) {
      const profile = activePlan.exam_profile
      if (stats.percentage < 20) {
        suggestions.push("Focus on Quantitative Aptitude modules first to build a solid baseline score.")
      } else if (stats.percentage >= 80) {
        suggestions.push("Awesome readiness! We recommend taking mock tests to build speed.")
      } else {
        suggestions.push("Your study streak is solid. Keep checking off revision guides.")
      }

      // Check category of next recommended
      if (nextRecommended) {
        suggestions.push(`Prioritize starting "${nextRecommended.name}" today to boost coverage.`)
      }
      
      if (profile === 'placement') {
        suggestions.push("Focus more on Technical Core concepts as they carry high marks weightage in placements.")
      } else {
        suggestions.push("Regular GK revision is critical to stay competitive in SSC/Bank cutoffs.")
      }
    }
    return suggestions
  }, [activePlan, stats.percentage, nextRecommended])

  // Weekly Recharts stats
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay)
    startOfWeek.setHours(0,0,0,0)

    const counts = [0, 0, 0, 0, 0, 0, 0]
    Object.keys(taskCompletionDates).forEach(k => {
      const dateStr = taskCompletionDates[k]
      if (dateStr) {
        const d = new Date(dateStr)
        if (d >= startOfWeek && d <= today) {
          counts[d.getDay()]++
        }
      }
    })

    return days.map((name, i) => ({ name, completed: counts[i] }))
  }, [taskCompletionDates])

  // Upcoming Revision Schedule: Spaced repetition for completed topics
  const revisionSchedule = useMemo(() => {
    return stats.completedTopics.slice(0, 3).map((topic, i) => {
      const days = [3, 7, 14]
      const revDate = new Date()
      revDate.setDate(revDate.getDate() + days[i])
      return {
        id: topic.id,
        name: topic.name,
        date: revDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })
  }, [stats.completedTopics])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Study Dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar userName={userName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              AI Study Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">Track your preparation, monitor progress, and receive personalized AI recommendations.</p>
          </div>
          
          {/* Active plan switcher */}
          {plans.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Plan:</span>
              <select
                value={activePlan?.id || ''}
                onChange={(e) => {
                  const plan = plans.find(p => p.id === e.target.value)
                  if (plan) handleSelectPlan(plan)
                }}
                className="glass-input rounded-xl px-4 py-2 text-sm text-white focus:outline-none appearance-none pr-8 cursor-pointer border border-white/10"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {plans.length === 0 ? (
          <div className="text-center p-16 glass-panel rounded-3xl border border-dashed border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white">No active study plans</h3>
            <p className="text-slate-400 max-w-md mx-auto">Generate your first custom AI study path to begin tracking your readiness dashboard.</p>
            <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg inline-block">
              Create Study Plan
            </Link>
          </div>
        ) : (
          <>
            {/* Top Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 🎯 Target Score */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Score</h3>
                    <p className="text-4xl font-black text-blue-400 mt-2">{activePlan?.target_score}%</p>
                  </div>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="mt-6 border-t border-white/5 pt-3 flex justify-between text-xs">
                  <span className="text-slate-400 font-bold capitalize">{activePlan?.exam_profile} Prep</span>
                  <span className="text-slate-500">45 days remaining</span>
                </div>
              </div>

              {/* 📈 Progress (Circular Progress) */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-4">
                  {/* Circular SVG */}
                  <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" 
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.percentage / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-white">{stats.percentage}%</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</h3>
                    <p className="text-xs text-slate-500 mt-1">{stats.completedTopicsCount} done / {stats.remainingTopicsCount} left</p>
                  </div>
                </div>
                <div className="mt-4 text-xs font-bold text-emerald-400">
                  "You're {stats.percentage}% exam ready!"
                </div>
              </div>

              {/* 📅 Today's Plan */}
              <div className="glass-panel p-5 rounded-3xl border border-white/5 relative overflow-hidden lg:col-span-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Today's Plan</span>
                  <span className="text-slate-500">~90 mins</span>
                </h3>
                
                {todaysPlanTopics.length === 0 ? (
                  <p className="text-xs text-emerald-400 mt-4 font-bold">🎉 All caught up for today!</p>
                ) : (
                  <div className="mt-3 space-y-2 max-h-[85px] overflow-y-auto custom-scrollbar">
                    {todaysPlanTopics.map(t => {
                      const vidId = `${t.id}-vid`
                      const pyqId = `${t.id}-pyq`
                      const prId = `${t.id}-practice`
                      return (
                        <div key={t.id} className="border-b border-white/5 pb-2">
                          <p className="text-xs font-bold text-slate-200 truncate">{t.name.split(':')[1]?.trim() || t.name}</p>
                          <div className="flex gap-2 mt-1">
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400">
                              <input type="checkbox" checked={!!completedTasks[vidId]} onChange={() => handleToggleTask(vidId)} className="w-3 h-3 rounded" />
                              Videos
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400">
                              <input type="checkbox" checked={!!completedTasks[pyqId]} onChange={() => handleToggleTask(pyqId)} className="w-3 h-3 rounded" />
                              PYQs
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400">
                              <input type="checkbox" checked={!!completedTasks[prId]} onChange={() => handleToggleTask(prId)} className="w-3 h-3 rounded" />
                              Practice
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 🤖 AI Suggestions */}
              <div className="glass-panel p-5 rounded-3xl border border-white/5 relative overflow-hidden">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <span>🤖 AI Suggestions</span>
                </h3>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  {aiSuggestions.map((msg, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-indigo-400">•</span>
                      <p className="leading-tight">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Main Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2-span): Weekly Chart & Full curriculum checklist */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Recharts Weekly Progress */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-sm font-bold text-slate-300 mb-6">Weekly Progress</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Full Curriculum Checklist */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                  <h3 className="text-sm font-bold text-slate-300 mb-6">Curriculum Checklist</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedTopics.map((topic, idx) => {
                      const vidId = `${topic.id}-vid`
                      const pyqId = `${topic.id}-pyq`
                      const prId = `${topic.id}-practice`
                      const isCompleted = completedTasks[vidId] && completedTasks[pyqId] && completedTasks[prId]

                      return (
                        <div key={topic.id} className={`bg-slate-900/30 p-4 rounded-2xl border transition-all ${isCompleted ? 'border-emerald-500/20' : 'border-white/5'}`}>
                          <div className="flex justify-between items-start border-b border-white/5 pb-2 mb-3">
                            <div>
                              <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                {idx + 1}. {topic.name}
                              </h4>
                              <span className="text-[10px] text-slate-500">{topic.category}</span>
                            </div>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              {topic.studyMinutes} mins
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleToggleTask(vidId)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                completedTasks[vidId] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              <span>🎥 Videos</span>
                            </button>
                            <button
                              onClick={() => handleToggleTask(pyqId)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                completedTasks[pyqId] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              <span>📝 PYQs</span>
                            </button>
                            <button
                              onClick={() => handleToggleTask(prId)}
                              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                completedTasks[prId] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              <span>🏆 Practice</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Readiness Score, Streak, Revision, Next Module, Completions */}
              <div className="space-y-6">
                
                {/* Overall Exam Readiness Score */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Readiness Score</h3>
                  <div className="text-6xl font-black text-white mt-4">{stats.readiness}</div>
                  <div className="text-xs text-indigo-300 mt-2 font-bold uppercase tracking-wide">Ready for Cutoff</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full" style={{ width: `${stats.readiness}%` }} />
                  </div>
                </div>

                {/* Daily Study Streak */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Study Streak</h3>
                    <p className="text-2xl font-black text-orange-400 mt-1">{streak} Days Active</p>
                  </div>
                  <span className="text-4xl animate-bounce">🔥</span>
                </div>

                {/* Next Recommended Module */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Recommended Module</h3>
                  {nextRecommended ? (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-white truncate">{nextRecommended.name}</p>
                      <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mt-1 uppercase">
                        {nextRecommended.category}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-400 mt-3 font-bold">🎉 All modules completed!</p>
                  )}
                </div>

                {/* Upcoming Revision Schedule */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Revision</h3>
                  {revisionSchedule.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No revision scheduled yet. Complete a topic to trigger schedule.</p>
                  ) : (
                    <div className="space-y-2">
                      {revisionSchedule.map(rev => (
                        <div key={rev.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-bold truncate max-w-[150px]">{rev.name.split(':')[1]?.trim()}</span>
                          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{rev.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Completed Topics */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Completions</h3>
                  {stats.completedTopics.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Completions will appear here as you finish modules.</p>
                  ) : (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {stats.completedTopics.map(t => (
                        <div key={t.id} className="flex gap-2 items-center text-xs text-emerald-400 font-bold">
                          <span>✓</span>
                          <span className="truncate text-slate-300 font-normal">{t.name.split(':')[1]?.trim() || t.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </>
        )}

      </main>
    </div>
  )
}
