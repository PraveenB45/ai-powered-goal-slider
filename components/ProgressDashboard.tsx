'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'

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

interface ProgressDashboardProps {
  user: any
  studentName: string
  selectedTopics: Topic[]
  completedTasks: Record<string, boolean>
  taskCompletionDates: Record<string, string>
  toggleTask: (taskId: string) => void
  formatTimer: (sec: number) => string
  studyTimer: number
  isTimerRunning: boolean
  setIsTimerRunning: (running: boolean) => void
  handleLeaveSession: () => void
  learningProgress: number
  stats: { totalTopics: number; timeSavedPercent: number; marksPercent: number }
  examProfile: 'govt' | 'placement'
  setCompletedTasks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setTaskCompletionDates: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export default function ProgressDashboard({
  user,
  studentName,
  selectedTopics,
  completedTasks,
  taskCompletionDates,
  toggleTask,
  formatTimer,
  studyTimer,
  isTimerRunning,
  setIsTimerRunning,
  handleLeaveSession,
  learningProgress,
  stats,
  examProfile,
  setCompletedTasks,
  setTaskCompletionDates
}: ProgressDashboardProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // 1. Calculate Subtasks
  const totalSubtasks = selectedTopics.length * 3
  const completedSubtasksCount = Object.values(completedTasks).filter(Boolean).length
  const remainingSubtasks = totalSubtasks - completedSubtasksCount
  const estimatedMinutesLeft = useMemo(() => {
    let remainingMins = 0
    selectedTopics.forEach((topic) => {
      if (!completedTasks[`${topic.id}-vid`]) remainingMins += (topic.studyMinutes * 0.3)
      if (!completedTasks[`${topic.id}-pyq`]) remainingMins += (topic.studyMinutes * 0.4)
      if (!completedTasks[`${topic.id}-practice`]) remainingMins += (topic.studyMinutes * 0.3)
    })
    return Math.round(remainingMins / 60)
  }, [selectedTopics, completedTasks])

  // 2. Calculate Weekly Chart Data
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    
    // Get the start of the current week (Sunday)
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const counts = [0, 0, 0, 0, 0, 0, 0]
    
    Object.values(taskCompletionDates).forEach(dateStr => {
      const d = new Date(dateStr)
      // If it falls within this week
      if (d >= startOfWeek && d <= today) {
        counts[d.getDay()] += 1
      }
    })
    
    return days.map((day, i) => ({
      name: day,
      completed: counts[i]
    }))
  }, [taskCompletionDates])

  // 3. Calculate Streak (Consecutive days with at least 1 completion leading up to today or yesterday)
  const streak = useMemo(() => {
    const dates = Object.values(taskCompletionDates)
      .map(d => {
        const dt = new Date(d)
        dt.setHours(0, 0, 0, 0)
        return dt.getTime()
      })
      .sort((a, b) => b - a) // Descending
      
    if (dates.length === 0) return 0
    
    const uniqueDates = Array.from(new Set(dates))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()
    const yesterdayMs = todayMs - 86400000
    
    let currentStreak = 0
    let checkDateMs = todayMs
    
    // Check if streak is broken (did not complete today or yesterday)
    if (uniqueDates[0] !== todayMs && uniqueDates[0] !== yesterdayMs) {
      return 0
    }
    
    if (uniqueDates[0] === yesterdayMs) {
      checkDateMs = yesterdayMs
    }
    
    for (const d of uniqueDates) {
      if (d === checkDateMs) {
        currentStreak++
        checkDateMs -= 86400000 // Go back one day
      } else {
        break
      }
    }
    
    return currentStreak
  }, [taskCompletionDates])

  // 4. Badges logic
  const badges = [
    { id: 'first', name: 'First Step', icon: '🌱', active: completedSubtasksCount >= 1 },
    { id: '25', name: '25% Done', icon: '🥉', active: learningProgress >= 25 },
    { id: '50', name: 'Halfway', icon: '🥈', active: learningProgress >= 50 },
    { id: '75', name: 'Almost There', icon: '🥇', active: learningProgress >= 75 },
    { id: '100', name: 'Master', icon: '🏆', active: learningProgress >= 100 }
  ]

  // 5. AI Motivation String
  const motivationMsg = useMemo(() => {
    if (learningProgress === 0) return "Great start! Click a task to begin your momentum."
    if (learningProgress < 25) return "You're building momentum. Keep pushing!"
    if (learningProgress < 50) return "You're getting the hang of it. Stay consistent!"
    if (learningProgress < 75) return "You're halfway there! Excellent focus."
    if (learningProgress < 100) return "Incredible work! You are almost exam-ready."
    return "Mission Accomplished! You are fully prepared."
  }, [learningProgress])

  const getPriority = (topic: Topic) => {
    const weight = examProfile === 'govt' ? topic.marksWeightageGovt : topic.marksWeightagePlacement
    if (weight > 12 || topic.difficulty > 7) return { label: 'High', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    if (weight > 8 || topic.difficulty > 4) return { label: 'Med', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    return { label: 'Low', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  }

  const handleReset = async () => {
    if (!user) {
      setCompletedTasks({})
      setTaskCompletionDates({})
      setShowResetConfirm(false)
      return
    }
    
    try {
      // Optimistic local update
      setCompletedTasks({})
      setTaskCompletionDates({})
      setShowResetConfirm(false)
      
      // Delete all progress for this user in DB
      await supabase
        .from('student_progress')
        .delete()
        .eq('student_id', user.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <motion.div
      key="guided-study"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel rounded-[32px] p-6 sm:p-8 border border-white/5 space-y-8 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <button
            onClick={handleLeaveSession}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-3 bg-slate-900 border border-white/5 rounded-full px-3.5 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Leave Dashboard
          </button>
          <h2 className="text-3xl font-black text-white">Learning Progress</h2>
          <p className="text-xs text-slate-400 mt-1">Track your personalized preparation journey</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Counter */}
          <div className="flex items-center gap-2 bg-slate-900/90 rounded-2xl p-3 border border-white/10" title="Daily Streak">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Streak</p>
              <p className="text-lg font-black text-orange-400 leading-none">{streak} <span className="text-sm font-medium text-slate-300">Days</span></p>
            </div>
          </div>

          {/* Session Timer Widget */}
          <div className="flex items-center gap-4 bg-slate-900/90 rounded-2xl p-3 px-4 border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session</p>
              <p className="text-lg font-mono font-black text-emerald-400 leading-none mt-0.5">{formatTimer(studyTimer)}</p>
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`p-2 rounded-full ${
                isTimerRunning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isTimerRunning ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards & Circular Progress */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Main Circular Progress + Motivation */}
        <div className="lg:col-span-1 bg-slate-900/50 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* SVG Circular Progress */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - learningProgress / 100)}`}
                strokeLinecap="round"
                className="text-emerald-400 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{learningProgress}%</span>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 rounded-full px-3 py-1 mb-2">
            🤖 AI Coach
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">{motivationMsg}</p>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-slate-900/80 transition-colors">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tasks</span>
            <p className="text-4xl font-black mt-2 text-slate-200">{totalSubtasks}</p>
            <p className="text-[10px] text-slate-500 mt-2">Across {selectedTopics.length} topics</p>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-slate-900/80 transition-colors">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
            <p className="text-4xl font-black mt-2 text-emerald-400">{completedSubtasksCount}</p>
            <p className="text-[10px] text-slate-500 mt-2">Awesome work!</p>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-slate-900/80 transition-colors">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
            <p className="text-4xl font-black mt-2 text-orange-400">{remainingSubtasks}</p>
            <p className="text-[10px] text-slate-500 mt-2">Keep it up</p>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-slate-900/80 transition-colors">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Time Left</span>
            <p className="text-4xl font-black mt-2 text-blue-400">{estimatedMinutesLeft}<span className="text-lg">h</span></p>
            <p className="text-[10px] text-slate-500 mt-2">AI calculated estimate</p>
          </div>
        </div>
      </div>

      {/* Horizontal Progress Bar & Badges */}
      <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-300">Overall Progress</span>
              <span className="text-xs font-bold text-emerald-400">{learningProgress}% Complete</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500 h-full transition-all duration-700 ease-out relative"
                style={{ width: `${learningProgress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-3 mt-6">
          <span className="text-xs font-bold text-slate-400 flex items-center mr-2">Achievements:</span>
          {badges.map(badge => (
            <div 
              key={badge.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                badge.active 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'bg-slate-900/50 border-white/5 text-slate-600 grayscale'
              }`}
            >
              <span className="text-base">{badge.icon}</span>
              <span className="text-xs font-bold tracking-tight">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Weekly Chart */}
        <div className="lg:col-span-1 bg-slate-900/40 rounded-3xl p-6 border border-white/5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 mb-6">Weekly Activity</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Topic Checklist */}
        <div className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-300">Topic Checklist</h3>
            <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full">{selectedTopics.length} Modules</span>
          </div>

          <div className="overflow-y-auto max-h-[400px] space-y-4 pr-2 custom-scrollbar">
            {selectedTopics.map((topic, idx) => {
              const priority = getPriority(topic)
              
              const vId = `${topic.id}-vid`
              const pId = `${topic.id}-pyq`
              const prId = `${topic.id}-practice`
              
              const isTopicDone = completedTasks[vId] && completedTasks[pId] && completedTasks[prId]

              return (
                <div key={topic.id} className={`bg-slate-950/50 rounded-2xl p-4 border transition-all ${isTopicDone ? 'border-emerald-500/20' : 'border-white/5'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold transition-colors ${isTopicDone ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {topic.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{topic.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priority.color}`}>
                        {priority.label} PRIORITY
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                        ~{topic.studyMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Tasks Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Videos */}
                    <div
                      onClick={() => toggleTask(vId)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        completedTasks[vId] ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center ${
                        completedTasks[vId] ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'
                      }`}>
                        {completedTasks[vId] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium ${completedTasks[vId] ? 'text-emerald-300' : 'text-slate-300'}`}>Videos</span>
                        {completedTasks[vId] && taskCompletionDates[vId] && (
                          <span className="text-[9px] text-emerald-500/70">{new Date(taskCompletionDates[vId]).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* PYQs */}
                    <div
                      onClick={() => toggleTask(pId)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        completedTasks[pId] ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center ${
                        completedTasks[pId] ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'
                      }`}>
                        {completedTasks[pId] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium ${completedTasks[pId] ? 'text-emerald-300' : 'text-slate-300'}`}>PYQs</span>
                        {completedTasks[pId] && taskCompletionDates[pId] && (
                          <span className="text-[9px] text-emerald-500/70">{new Date(taskCompletionDates[pId]).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Practice */}
                    <div
                      onClick={() => toggleTask(prId)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        completedTasks[prId] ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center ${
                        completedTasks[prId] ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600'
                      }`}>
                        {completedTasks[prId] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium ${completedTasks[prId] ? 'text-emerald-300' : 'text-slate-300'}`}>Practice</span>
                        {completedTasks[prId] && taskCompletionDates[prId] && (
                          <span className="text-[9px] text-emerald-500/70">{new Date(taskCompletionDates[prId]).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer / Reset Action */}
      <div className="flex justify-end border-t border-white/5 pt-6 mt-4">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
          >
            Reset All Progress
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
            <span className="text-xs text-red-300 font-bold ml-2">Are you sure?</span>
            <button
              onClick={handleReset}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors"
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

    </motion.div>
  )
}
