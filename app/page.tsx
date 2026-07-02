'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProgressDashboard from '@/components/ProgressDashboard'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// 1. Dataset for Government Exams & Placement Drives
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

// Fallback data used when Supabase is unavailable or topics table is empty
const fallbackTopics: Topic[] = [
  {
    id: 't1',
    name: 'Quantitative Aptitude: Percentages & Interest',
    category: 'Quantitative Aptitude',
    pyqFrequency: 10,
    marksWeightageGovt: 14,
    marksWeightagePlacement: 10,
    difficulty: 3,
    studentWeakness: 3,
    videos: 5,
    pyqs: 25,
    practice: 40,
    notes: 6,
    studyMinutes: 120,
    syllabusWeight: 10
  },
  {
    id: 't2',
    name: 'Quantitative Aptitude: Time, Speed & Distance',
    category: 'Quantitative Aptitude',
    pyqFrequency: 8,
    marksWeightageGovt: 12,
    marksWeightagePlacement: 8,
    difficulty: 6,
    studentWeakness: 5,
    videos: 4,
    pyqs: 18,
    practice: 30,
    notes: 5,
    studyMinutes: 110,
    syllabusWeight: 9
  },
  {
    id: 't3',
    name: 'Data Interpretation: Charts & Tables',
    category: 'Quantitative Aptitude',
    pyqFrequency: 9,
    marksWeightageGovt: 15,
    marksWeightagePlacement: 12,
    difficulty: 5,
    studentWeakness: 4,
    videos: 4,
    pyqs: 22,
    practice: 35,
    notes: 4,
    studyMinutes: 90,
    syllabusWeight: 11
  },
  {
    id: 't4',
    name: 'Logical Reasoning: Syllogisms & Arrangements',
    category: 'Logical Reasoning',
    pyqFrequency: 9,
    marksWeightageGovt: 13,
    marksWeightagePlacement: 10,
    difficulty: 4,
    studentWeakness: 6,
    videos: 4,
    pyqs: 20,
    practice: 30,
    notes: 5,
    studyMinutes: 95,
    syllabusWeight: 10
  },
  {
    id: 't5',
    name: 'Logical Reasoning: Coding-Decoding & Series',
    category: 'Logical Reasoning',
    pyqFrequency: 10,
    marksWeightageGovt: 10,
    marksWeightagePlacement: 8,
    difficulty: 2,
    studentWeakness: 2,
    videos: 3,
    pyqs: 28,
    practice: 45,
    notes: 4,
    studyMinutes: 70,
    syllabusWeight: 8
  },
  {
    id: 't6',
    name: 'Verbal Ability: Reading Comprehension',
    category: 'Verbal & English',
    pyqFrequency: 7,
    marksWeightageGovt: 12,
    marksWeightagePlacement: 10,
    difficulty: 5,
    studentWeakness: 4,
    videos: 3,
    pyqs: 15,
    practice: 25,
    notes: 5,
    studyMinutes: 80,
    syllabusWeight: 10
  },
  {
    id: 't7',
    name: 'Verbal Ability: Error Spotting & Grammar',
    category: 'Verbal & English',
    pyqFrequency: 8,
    marksWeightageGovt: 8,
    marksWeightagePlacement: 6,
    difficulty: 3,
    studentWeakness: 5,
    videos: 3,
    pyqs: 16,
    practice: 30,
    notes: 4,
    studyMinutes: 65,
    syllabusWeight: 7
  },
  {
    id: 't8',
    name: 'Technical: Data Structures & Algorithms',
    category: 'Technical Core',
    pyqFrequency: 8,
    marksWeightageGovt: 2,
    marksWeightagePlacement: 22,
    difficulty: 7,
    studentWeakness: 8,
    videos: 9,
    pyqs: 30,
    practice: 50,
    notes: 10,
    studyMinutes: 240,
    syllabusWeight: 18
  },
  {
    id: 't9',
    name: 'Technical: Database Systems (DBMS) & SQL',
    category: 'Technical Core',
    pyqFrequency: 6,
    marksWeightageGovt: 4,
    marksWeightagePlacement: 12,
    difficulty: 4,
    studentWeakness: 4,
    videos: 4,
    pyqs: 15,
    practice: 25,
    notes: 6,
    studyMinutes: 100,
    syllabusWeight: 10
  },
  {
    id: 't10',
    name: 'General Awareness: Economy & Current Affairs',
    category: 'General Knowledge',
    pyqFrequency: 9,
    marksWeightageGovt: 10,
    marksWeightagePlacement: 2,
    difficulty: 5,
    studentWeakness: 6,
    videos: 5,
    pyqs: 30,
    practice: 40,
    notes: 8,
    studyMinutes: 110,
    syllabusWeight: 9
  }
]

type ExamProfile = 'govt' | 'placement'
type FilterKey = 'pyq' | 'weightage' | 'easy' | 'difficult' | 'weak' | 'ai_balanced'

export default function Home() {
  const router = useRouter()

  // Auth State
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  // Data from DB
  const [topicsFromDB, setTopicsFromDB] = useState<Topic[]>([])
  const [dbLoaded, setDbLoaded] = useState(false)

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Exam Preparation Profile
  const [examProfile, setExamProfile] = useState<ExamProfile>('govt')

  // Filters and AI Custom Weights
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ai_balanced')
  const [weightPYQ, setWeightPYQ] = useState(0.4)
  const [weightWeightage, setWeightWeightage] = useState(0.3)
  const [weightDifficulty, setWeightDifficulty] = useState(0.1)
  const [weightWeakness, setWeightWeakness] = useState(0.2)

  // Goal Slider Value
  const [goalPercent, setGoalPercent] = useState(60)

  // Manual Overrides (Fine-tuning)
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({})
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false)

  // Start Learning Simulator state
  const [isLearningActive, setIsLearningActive] = useState(false)
  const [studyTimer, setStudyTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})
  const [taskCompletionDates, setTaskCompletionDates] = useState<Record<string, string>>({})
  
  // Active Plan tracking
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  // Use DB topics if loaded, otherwise fallback
  const defaultTopics = dbLoaded && topicsFromDB.length > 0 ? topicsFromDB : fallbackTopics

  // =============================================
  // Auth: Check session on mount
  // =============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          setStudentName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student')
        }
      } catch {
        // Supabase unreachable — allow offline usage
        setUser(null)
      }
      setAuthLoading(false)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setStudentName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student')
      }
    })

    // Load Plan from URL if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const planId = params.get('planId')
      if (planId) {
        setActivePlanId(planId)
        loadPlanDetails(planId)
      }
    }

    return () => subscription.unsubscribe()
  }, [])

  const loadPlanDetails = async (planId: string) => {
    try {
      const { data } = await supabase.from('study_plans').select('*').eq('id', planId).single()
      if (data) {
        setGoalPercent(data.target_score)
        setExamProfile(data.exam_profile)
        // If manual overrides were saved, we'd restore them here. We'll add it to the save logic below.
        if (data.selected_topics && data.selected_topics.manualOverrides) {
          setManualOverrides(data.selected_topics.manualOverrides)
        }
      }
    } catch (e) {
      console.error('Failed to load plan', e)
    }
  }

  // =============================================
  // DB: Fetch topics from Supabase
  // =============================================
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .order('id')

        if (!error && data && data.length > 0) {
          const mapped: Topic[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            pyqFrequency: t.pyq_frequency,
            marksWeightageGovt: t.marks_weightage_govt,
            marksWeightagePlacement: t.marks_weightage_placement,
            difficulty: t.difficulty,
            studentWeakness: 5, // Will be overwritten by student-specific weakness
            videos: t.videos,
            pyqs: t.pyqs,
            practice: t.practice,
            notes: t.notes,
            studyMinutes: t.study_minutes,
            syllabusWeight: t.syllabus_weight
          }))
          setTopicsFromDB(mapped)
        }
      } catch {
        // Supabase unavailable — fallback topics are used
      }
      setDbLoaded(true)
    }
    fetchTopics()
  }, [])

  // =============================================
  // DB: Load student weakness scores from Supabase
  // =============================================
  useEffect(() => {
    if (!user || topicsFromDB.length === 0) return
    const fetchWeakness = async () => {
      try {
        const { data } = await supabase
          .from('student_weakness')
          .select('topic_id, weakness_score')
          .eq('student_id', user.id)

        if (data && data.length > 0) {
          setTopicsFromDB(prev => prev.map(t => {
            const found = data.find((w: any) => w.topic_id === t.id)
            return found ? { ...t, studentWeakness: found.weakness_score } : t
          }))
        }
      } catch {
        // Ignore — use default weakness
      }
    }
    fetchWeakness()
  }, [user, dbLoaded])

  // =============================================
  // DB: Load student progress (completed tasks) from Supabase
  // =============================================
  useEffect(() => {
    if (!user || !activePlanId) return
    const fetchProgress = async () => {
      try {
        const { data } = await supabase
          .from('student_progress')
          .select('topic_id, videos_done, pyqs_done, practice_done, videos_completed_at, pyqs_completed_at, practice_completed_at')
          .eq('plan_id', activePlanId)

        if (data && data.length > 0) {
          const tasks: Record<string, boolean> = {}
          const dates: Record<string, string> = {}
          data.forEach((row: any) => {
            if (row.videos_done) { tasks[`${row.topic_id}-vid`] = true; if (row.videos_completed_at) dates[`${row.topic_id}-vid`] = row.videos_completed_at }
            if (row.pyqs_done) { tasks[`${row.topic_id}-pyq`] = true; if (row.pyqs_completed_at) dates[`${row.topic_id}-pyq`] = row.pyqs_completed_at }
            if (row.practice_done) { tasks[`${row.topic_id}-practice`] = true; if (row.practice_completed_at) dates[`${row.topic_id}-practice`] = row.practice_completed_at }
          })
          setCompletedTasks(tasks)
          setTaskCompletionDates(dates)
        } else {
          setCompletedTasks({})
          setTaskCompletionDates({})
        }
      } catch {
        // Ignore — use local state
      }
    }
    fetchProgress()
  }, [user, activePlanId])

  // =============================================
  // DB: Save progress when tasks are toggled
  // =============================================
  const saveProgress = useCallback(async (topicId: string, taskType: string, isDone: boolean) => {
    if (!user || !activePlanId) return
    try {
      const column = taskType === 'vid' ? 'videos_done' : taskType === 'pyq' ? 'pyqs_done' : 'practice_done'
      const dateColumn = taskType === 'vid' ? 'videos_completed_at' : taskType === 'pyq' ? 'pyqs_completed_at' : 'practice_completed_at'
      const timestamp = isDone ? new Date().toISOString() : null
      
      await supabase
        .from('student_progress')
        .upsert({
          student_id: user.id,
          plan_id: activePlanId,
          topic_id: topicId,
          [column]: isDone,
          [dateColumn]: timestamp,
          updated_at: new Date().toISOString()
        }, { onConflict: 'plan_id,topic_id' })
        
      // Also update the study plan's updated_at timestamp
      await supabase.from('study_plans').update({ updated_at: new Date().toISOString() }).eq('id', activePlanId)
    } catch {
      // Ignore — local state still works
    }
  }, [user, activePlanId])

  const handleSavePlan = async () => {
    if (!user) {
      router.push('/auth')
      return
    }
    const title = prompt('Enter a name for this Study Plan:', `${examProfile.toUpperCase()} Target ${goalPercent}%`)
    if (!title) return
    
    setIsSavingPlan(true)
    try {
      // Save to Supabase
      const { data, error } = await supabase.from('study_plans').insert({
        student_id: user.id,
        title,
        target_score: goalPercent,
        available_time: selectedTopics.reduce((acc, t) => acc + t.studyMinutes, 0),
        exam_profile: examProfile,
        selected_topics: { manualOverrides } // Storing overrides so we can accurately restore the exact plan
      }).select('id').single()
      
      if (error) throw error
      if (data) {
        setActivePlanId(data.id)
        // Redirect to the AI Study Dashboard as the central hub
        router.push('/dashboard')
      }
    } catch (err: any) {
      alert('Error saving plan: ' + err.message)
    } finally {
      setIsSavingPlan(false)
    }
  }


  // =============================================
  // Auth: Logout handler
  // =============================================
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompletedTasks({})
    router.push('/auth')
  }

  // Apply dark mode class on html tag
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  // Timer logic for study simulation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // 2. Score Calculation Formula
  const calculateTopicScore = (topic: Topic) => {
    // Difficulty score prioritize easy: (10 - difficulty)
    const normalizedDifficulty = 10 - topic.difficulty
    const marksWeightage = examProfile === 'govt' ? topic.marksWeightageGovt : topic.marksWeightagePlacement
    return (
      topic.pyqFrequency * weightPYQ +
      marksWeightage * weightWeightage +
      normalizedDifficulty * weightDifficulty +
      topic.studentWeakness * weightWeakness
    )
  }

  // Helper to extract the correct marks weight based on current exam profile
  const getTopicMarks = (topic: Topic) => {
    return examProfile === 'govt' ? topic.marksWeightageGovt : topic.marksWeightagePlacement
  }

  // 3. Sort / Rank topics based on filters or customized AI Score
  const rankedTopics = useMemo(() => {
    const sorted = [...defaultTopics]
    switch (activeFilter) {
      case 'pyq':
        return sorted.sort((a, b) => b.pyqFrequency - a.pyqFrequency)
      case 'weightage':
        return sorted.sort((a, b) => getTopicMarks(b) - getTopicMarks(a))
      case 'easy':
        return sorted.sort((a, b) => a.difficulty - b.difficulty)
      case 'difficult':
        return sorted.sort((a, b) => b.difficulty - a.difficulty)
      case 'weak':
        return sorted.sort((a, b) => b.studentWeakness - a.studentWeakness)
      case 'ai_balanced':
      default:
        return sorted.sort((a, b) => calculateTopicScore(b) - calculateTopicScore(a))
    }
  }, [activeFilter, examProfile, weightPYQ, weightWeightage, weightDifficulty, weightWeakness])

  // 4. Recommendation Selector (Goal Slider Optimizer)
  // Finds the minimum number of topics to satisfy the goal percentage of marks
  const recommendedTopicIds = useMemo(() => {
    const selectedIds = new Set<string>()
    const totalMarksPossible = defaultTopics.reduce((sum, t) => sum + getTopicMarks(t), 0)
    const targetMarks = (goalPercent / 100) * totalMarksPossible

    // Add forced topics first
    Object.entries(manualOverrides).forEach(([id, included]) => {
      if (included) selectedIds.add(id)
    })

    // If we haven't met target marks yet, keep adding according to ranked path,
    // skipping anything explicitly excluded.
    let currentMarks = defaultTopics
      .filter((t) => selectedIds.has(t.id) && manualOverrides[t.id] !== false)
      .reduce((sum, t) => sum + getTopicMarks(t), 0)

    for (const topic of rankedTopics) {
      if (currentMarks >= targetMarks) break
      if (manualOverrides[topic.id] === false) continue // Forced out
      if (!selectedIds.has(topic.id)) {
        selectedIds.add(topic.id)
        currentMarks += getTopicMarks(topic)
      }
    }

    return selectedIds
  }, [rankedTopics, goalPercent, manualOverrides, examProfile])

  // Topics that are currently selected (including manual overrides)
  const selectedTopics = useMemo(() => {
    return defaultTopics.filter((t) => recommendedTopicIds.has(t.id))
  }, [recommendedTopicIds])

  // 5. Statistics & Live Metrics Calculation
  const stats = useMemo(() => {
    const totalTopicsCount = selectedTopics.length
    const videos = selectedTopics.reduce((sum, item) => sum + item.videos, 0)
    const pyqs = selectedTopics.reduce((sum, item) => sum + item.pyqs, 0)
    const practice = selectedTopics.reduce((sum, item) => sum + item.practice, 0)
    const notes = selectedTopics.reduce((sum, item) => sum + item.notes, 0)
    const minutes = selectedTopics.reduce((sum, item) => sum + item.studyMinutes, 0)

    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    const studyTime = minutes > 0 ? `${hours}h ${remainingMins}m` : '0m'

    const totalSyllabusSum = defaultTopics.reduce((sum, t) => sum + t.syllabusWeight, 0)
    const selectedSyllabusSum = selectedTopics.reduce((sum, t) => sum + t.syllabusWeight, 0)
    const syllabusPercent = totalSyllabusSum > 0 ? Math.min(100, Math.round((selectedSyllabusSum / totalSyllabusSum) * 100)) : 0

    const totalMarksSum = defaultTopics.reduce((sum, t) => sum + getTopicMarks(t), 0)
    const selectedMarksSum = selectedTopics.reduce((sum, t) => sum + getTopicMarks(t), 0)
    const marksPercent = totalMarksSum > 0 ? Math.min(100, Math.round((selectedMarksSum / totalMarksSum) * 100)) : 0

    // Goal Achievement calculation: How close is the expected marks to the goalPercent requested?
    const achievementPercent = goalPercent > 0 ? Math.min(100, Math.round((marksPercent / goalPercent) * 100)) : 100

    // Study Time / Effort Saved calculation
    const totalMinutesPossible = defaultTopics.reduce((sum, t) => sum + t.studyMinutes, 0)
    const timeSavedPercent = totalMinutesPossible > 0 ? Math.round((1 - minutes / totalMinutesPossible) * 100) : 0

    return {
      totalTopics: totalTopicsCount,
      videos,
      pyqs,
      practice,
      notes,
      studyTime,
      syllabusPercent,
      marksPercent,
      achievementPercent,
      expectedScore: marksPercent,
      timeSavedPercent
    }
  }, [selectedTopics, goalPercent, examProfile])

  // 6. Cumulative Graph Curve builder
  // We plot topics in their ranked order and calculate cumulative coverage
  const chartData = useMemo(() => {
    let cumulativeSyllabus = 0
    let cumulativeMarks = 0
    const totalSyllabusSum = defaultTopics.reduce((sum, t) => sum + t.syllabusWeight, 0)
    const totalMarksSum = defaultTopics.reduce((sum, t) => sum + getTopicMarks(t), 0)

    // Base point
    const data = [{
      name: 'Start',
      syllabus: 0,
      marks: 0,
      isSelected: false,
      topicName: 'Start'
    }]

    rankedTopics.forEach((topic) => {
      cumulativeSyllabus += topic.syllabusWeight
      cumulativeMarks += getTopicMarks(topic)
      const syllabusPercent = Math.min(100, Math.round((cumulativeSyllabus / totalSyllabusSum) * 100))
      const marksPercent = Math.min(100, Math.round((cumulativeMarks / totalMarksSum) * 100))
      
      data.push({
        name: topic.name.split(':')[1]?.trim().split(' ')[0] || topic.name.split(' ')[0], // short name
        syllabus: syllabusPercent,
        marks: marksPercent,
        isSelected: recommendedTopicIds.has(topic.id),
        topicName: topic.name
      })
    })

    return data
  }, [rankedTopics, recommendedTopicIds, examProfile])

  // Actions
  const handleReset = () => {
    setGoalPercent(100)
    setManualOverrides({})
  }

  const handleFineTuneToggle = (topicId: string) => {
    setManualOverrides((prev) => {
      const isIncluded = recommendedTopicIds.has(topicId)
      return {
        ...prev,
        [topicId]: !isIncluded
      }
    })
  }

  // Study Timer utility
  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleTask = (taskId: string) => {
    const newValue = !completedTasks[taskId]
    setCompletedTasks((prev) => ({ ...prev, [taskId]: newValue }))
    
    // Also update local dates immediately for UI responsiveness
    setTaskCompletionDates((prev) => {
      const newDates = { ...prev }
      if (newValue) {
        newDates[taskId] = new Date().toISOString()
      } else {
        delete newDates[taskId]
      }
      return newDates
    })

    // Parse topicId and taskType from the composite key (e.g. "t1-vid")
    const parts = taskId.split('-')
    const taskType = parts.pop() || ''
    const topicId = parts.join('-')
    saveProgress(topicId, taskType, newValue)
  }

  // Calculate learning progress percentage
  const learningProgress = useMemo(() => {
    const totalTasks = selectedTopics.length * 3 // Video, PYQ, Practice per topic
    if (totalTasks === 0) return 0
    const completedCount = Object.values(completedTasks).filter(Boolean).length
    return Math.round((completedCount / totalTasks) * 100)
  }, [selectedTopics, completedTasks])

  // Auth loading screen
  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-orange-500 flex items-center justify-center font-black text-white text-2xl shadow-2xl mx-auto pulse-glow">
            G
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading GoalSlider AI...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 transition-colors duration-300 relative text-slate-100 dark:text-slate-100">
      <div className="bg-mesh" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg pulse-glow">
            G
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              GoalSlider AI
            </h1>
            <p className="text-xs text-slate-400 font-medium">Smart Government & Campus Placement Prep</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark mode switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-full glass-input hover:scale-105 transition-transform"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2.5 rounded-full glass-input px-3.5 py-1.5 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 pulse-glow" />
            <span className="text-slate-300 font-medium">
              Mode: {examProfile === 'govt' ? 'Govt Exams (SSC/Bank)' : 'Placement Drives'}
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-4">
              <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/plans" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">My Plans</Link>
              <div className="hidden sm:block text-right ml-2">
                <p className="text-xs font-bold text-slate-200">{studentName}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                title="Sign out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all ml-4"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Dashboard Panel */}
        <AnimatePresence mode="wait">
          {!isLearningActive ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              
              {/* TOP HERO SECTION: Interactive Goal Slider */}
              <section className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  
                  {/* Title & Exam Mode Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-400/20 text-orange-300 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 pulse-glow" />
                        Targeted Score Optimizer
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">Set Your Ambition Level</h2>
                    </div>

                    {/* Active Exam Mode Choice */}
                    <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 self-start sm:self-auto">
                      <button
                        onClick={() => {
                          setExamProfile('govt')
                          setManualOverrides({})
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          examProfile === 'govt'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🏛️ Govt Exam
                      </button>
                      <button
                        onClick={() => {
                          setExamProfile('placement')
                          setManualOverrides({})
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          examProfile === 'placement'
                            ? 'bg-orange-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        💼 Placement
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-400">
                    Traditional prep forces you to study everything. Using previous year question (PYQ) trends and subject weightages, GoalSlider helps you focus on high-yield areas. **Set your targeted passing or top marks** below.
                  </p>

                  {/* Goal Slider Controller */}
                  <div className="glass-panel bg-slate-950/40 rounded-2xl p-6 border border-white/5 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Target Score Bracket:</span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
                        {goalPercent}% Marks
                      </span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={goalPercent}
                      onChange={(e) => setGoalPercent(Number(e.target.value))}
                      className="premium-slider my-4"
                    />

                    {/* TARGET PRESET QUICK BUTTONS */}
                    <div className="flex flex-wrap gap-2.5 items-center mt-3 pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-400 font-bold">Quick Presets:</span>
                      <button
                        onClick={() => setGoalPercent(60)}
                        className={`px-3 py-1 rounded-lg text-xxs font-black transition-all border ${
                          goalPercent === 60 ? 'bg-emerald-600 border-transparent text-white' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                        }`}
                      >
                        🎯 Just Pass (60%)
                      </button>
                      <button
                        onClick={() => setGoalPercent(75)}
                        className={`px-3 py-1 rounded-lg text-xxs font-black transition-all border ${
                          goalPercent === 75 ? 'bg-blue-600 border-transparent text-white' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                        }`}
                      >
                        ⭐ Competitive (75%)
                      </button>
                      <button
                        onClick={() => setGoalPercent(90)}
                        className={`px-3 py-1 rounded-lg text-xxs font-black transition-all border ${
                          goalPercent === 90 ? 'bg-orange-500 border-transparent text-white' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                        }`}
                      >
                        👑 Topper Bracket (90%)
                      </button>
                    </div>
                  </div>

                  {/* Summary preview */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Topics</p>
                      <p className="text-xl font-bold mt-1 text-slate-200">{stats.totalTopics} of 10 modules</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Marks</p>
                      <p className="text-xl font-bold mt-1 text-orange-400">{stats.marksPercent}% score</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Duration</p>
                      <p className="text-xl font-bold mt-1 text-blue-400">{stats.studyTime}</p>
                    </div>
                  </div>
                </div>

                {/* AI Score Calibration panel */}
                <div className="glass-panel rounded-[32px] p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Formula Calibration
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Customize coefficients of the Recommendation Engine logic. The sum of all weights will direct the prioritization sorting.
                    </p>
                  </div>

                  {/* Live Formula Weights sliders */}
                  <div className="space-y-4 my-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">PYQ Weight (40%)</span>
                        <span className="text-blue-400">{Math.round(weightPYQ * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weightPYQ}
                        onChange={(e) => setWeightPYQ(Number(e.target.value))}
                        className="w-full accent-blue-400 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Marks Weightage (30%)</span>
                        <span className="text-orange-400">{Math.round(weightWeightage * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weightWeightage}
                        onChange={(e) => setWeightWeightage(Number(e.target.value))}
                        className="w-full accent-orange-400 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Easy First (10%)</span>
                        <span className="text-emerald-400">{Math.round(weightDifficulty * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weightDifficulty}
                        onChange={(e) => setWeightDifficulty(Number(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Weak Areas Priority (20%)</span>
                        <span className="text-pink-400">{Math.round(weightWeakness * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weightWeakness}
                        onChange={(e) => setWeightWeakness(Number(e.target.value))}
                        className="w-full accent-pink-400 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="text-xs bg-slate-900/60 rounded-xl p-3 border border-white/5 text-slate-300 italic text-center">
                    Topic Score = (PYQ × {weightPYQ}) + (Marks × {weightWeightage}) + (Easy × {weightDifficulty}) + (Weakness × {weightWeakness})
                  </div>
                </div>
              </section>

              {/* QUICK FILTERS BAR */}
              <section className="flex flex-wrap gap-2.5 items-center justify-between bg-slate-900/50 p-4 rounded-3xl border border-white/5 glass-panel">
                <span className="text-sm font-bold text-slate-400 px-2">Optimize Path For:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter('ai_balanced')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'ai_balanced'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    ✨ AI Balanced
                  </button>
                  <button
                    onClick={() => setActiveFilter('pyq')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'pyq'
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    📚 PYQ Priority
                  </button>
                  <button
                    onClick={() => setActiveFilter('weightage')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'weightage'
                        ? 'bg-orange-500 text-white border-transparent'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    🔥 High Weightage
                  </button>
                  <button
                    onClick={() => setActiveFilter('easy')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'easy'
                        ? 'bg-emerald-600 text-white border-transparent'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ Easy First
                  </button>
                  <button
                    onClick={() => setActiveFilter('difficult')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'difficult'
                        ? 'bg-red-600 text-white border-transparent'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    💀 Difficult First
                  </button>
                  <button
                    onClick={() => setActiveFilter('weak')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeFilter === 'weak'
                        ? 'bg-pink-600 text-white border-transparent'
                        : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    🧠 Weak Areas
                  </button>
                </div>
              </section>

              {/* LIVE DASHBOARD STATS */}
              <section className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                
                {/* Expected Score Ring */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 col-span-2 sm:col-span-1 flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Expected Score</span>
                  <div className="relative flex items-center justify-center my-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" className="text-slate-800/80" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#fb923c"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - stats.marksPercent / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-slate-100">{stats.marksPercent}%</span>
                  </div>
                  <span className="text-xs text-slate-400">Total Marks Expected</span>
                </div>

                {/* STUDY EFFORT SAVED CARD */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 col-span-2 sm:col-span-1 flex flex-col items-center justify-between text-center relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Study Effort Saved</span>
                  <div className="relative flex items-center justify-center my-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" className="text-slate-800/80" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - stats.timeSavedPercent / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-emerald-400">-{stats.timeSavedPercent}%</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Preparation Time Saved</span>
                </div>

                {/* Selected Topics Card */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Topics</span>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black">{stats.totalTopics}</p>
                    <p className="text-xs text-slate-400 mt-1">Recommended</p>
                  </div>
                </div>

                {/* Resources Card (Videos & Notes) */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Materials</span>
                    <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.videos} Videos</p>
                    <p className="text-xs text-slate-400 mt-1">{stats.notes} Reference PDFs</p>
                  </div>
                </div>

                {/* PYQ & Practice Card */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between col-span-2 md:col-span-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practice Stats</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.pyqs} PYQs</p>
                    <p className="text-xs text-slate-400 mt-1">{stats.practice} Practice Qs</p>
                  </div>
                </div>

              </section>

              {/* LIVE ANALYTICS CHART & TOPICS LIST */}
              <section className="grid gap-6 lg:grid-cols-3">
                
                {/* 1. Recharts Graph Panel */}
                <div className="lg:col-span-2 glass-panel rounded-[32px] p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                        Syllabus vs Marks Coverage Curve
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Plotting cumulative growth in ranked order of topics</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <span className="w-3 h-1 bg-blue-500 rounded" />
                        Syllabus (%)
                      </span>
                      <span className="flex items-center gap-1.5 text-orange-400">
                        <span className="w-3 h-1 bg-orange-500 rounded" />
                        Expected Marks (%)
                      </span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="orangeG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#334155" opacity={0.25} vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                          formatter={(value: any, name: string): [string, string] => {
                            const label = name === 'syllabus' ? 'Syllabus Coverage' : 'Expected Marks'
                            return [`${value}%`, label]
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="syllabus"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#blueG)"
                        />
                        <Area
                          type="monotone"
                          dataKey="marks"
                          stroke="#f97316"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#orangeG)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Topics List Side-Panel */}
                <div className="glass-panel rounded-[32px] p-6 border border-white/5 flex flex-col justify-between h-[450px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Preparation Path</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Ranked by score utility</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-900 border border-white/5 rounded-full px-3 py-1">
                      {selectedTopics.length} selected
                    </span>
                  </div>

                  {/* Scrollable List */}
                  <div className="overflow-y-auto flex-1 space-y-2.5 pr-1.5">
                    {rankedTopics.map((topic, index) => {
                      const isSelected = recommendedTopicIds.has(topic.id)
                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleFineTuneToggle(topic.id)}
                          className={`group rounded-xl p-3.5 border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/30'
                              : 'bg-slate-900/40 border-white/5 opacity-55 hover:opacity-85'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-black text-slate-500 w-5 text-center mt-1">
                              #{index + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-semibold tracking-tight text-slate-200 group-hover:text-white transition-colors">
                                {topic.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                                <span className="bg-slate-950 px-2 py-0.5 rounded border border-white/5 text-slate-300">
                                  Weight: {getTopicMarks(topic)}%
                                </span>
                                <span>{topic.category}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-500 border-blue-400 text-white'
                                  : 'border-slate-700'
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions buttons inside side panel */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                    <button
                      onClick={() => setIsFineTuneOpen(true)}
                      className="py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      🔧 Fine Tune
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-slate-900 text-xs font-bold text-slate-400"
                    >
                      Reset Full
                    </button>
                  </div>
                </div>
              </section>

              {/* SIMULATED AI EXPLANATION & ACTION */}
              <section className="glass-panel rounded-[32px] p-6 sm:p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-3 flex-1 z-10">
                  <div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 rounded-full px-3 py-1">
                    🤖 AI Strategic Analysis
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Your Custom Preparation Path Is Ready</h3>
                  <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                    By focusing on the recommended <span className="text-orange-400 font-bold">{stats.totalTopics} modules</span>, you achieve your desired <span className="text-orange-400 font-bold">{goalPercent}% marks</span> buffer. We bypass low-frequency or high-difficulty concepts, saving you **{stats.timeSavedPercent}% of the study time** compared to reviewing the full syllabus.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
                  {activePlanId ? (
                    <button
                      onClick={() => {
                        setIsLearningActive(true)
                        setIsTimerRunning(true)
                      }}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group transition-all"
                    >
                      Continue Learning
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSavePlan}
                        disabled={isSavingPlan}
                        className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wide border border-white/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isSavingPlan ? 'Saving...' : 'Save Study Plan'}
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button
                        onClick={() => {
                          setIsLearningActive(true)
                          setIsTimerRunning(true)
                        }}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold tracking-wide shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition-all"
                      >
                        Start Learning Without Saving
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </section>

            </motion.div>
          ) : (
            // SIMULATED GUIDED STUDY ENVIRONMENT
            <ProgressDashboard
              user={user}
              studentName={studentName}
              selectedTopics={selectedTopics}
              completedTasks={completedTasks}
              taskCompletionDates={taskCompletionDates}
              toggleTask={toggleTask}
              formatTimer={formatTimer}
              studyTimer={studyTimer}
              isTimerRunning={isTimerRunning}
              setIsTimerRunning={setIsTimerRunning}
              handleLeaveSession={() => {
                setIsLearningActive(false)
                setIsTimerRunning(false)
              }}
              learningProgress={learningProgress}
              stats={stats}
              examProfile={examProfile}
              setCompletedTasks={setCompletedTasks}
              setTaskCompletionDates={setTaskCompletionDates}
              activePlanId={activePlanId}
            />
          )}
        </AnimatePresence>

      </div>

      {/* FINE TUNE MODAL POPUP */}
      <AnimatePresence>
        {isFineTuneOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFineTuneOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/10 z-10 max-h-[85vh] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Manual Path Fine-Tuning</h3>
                    <p className="text-xs text-slate-400 mt-1">Force include/exclude individual topics to override AI optimization.</p>
                  </div>
                  <button
                    onClick={() => setIsFineTuneOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Topics selection grid */}
                <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-1">
                  {defaultTopics.map((topic) => {
                    const isSelected = recommendedTopicIds.has(topic.id)
                    const topicMarks = getTopicMarks(topic)
                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleFineTuneToggle(topic.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/70'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-200">{topic.name}</p>
                          <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                            <span>Syllabus: {topic.syllabusWeight}%</span>
                            <span>•</span>
                            <span>Weightage: {topicMarks}%</span>
                            <span>•</span>
                            <span className={topic.difficulty > 6 ? 'text-red-400' : 'text-slate-400'}>
                              Difficulty: {topic.difficulty}/10
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                              Included
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              Excluded
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setManualOverrides({})}
                  className="px-4 py-2 border border-white/5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Clear Overrides
                </button>
                <button
                  onClick={() => setIsFineTuneOpen(false)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
