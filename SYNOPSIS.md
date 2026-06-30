# Project Synopsis: GoalSlider AI
**Smart Exam & Campus Placement Preparation Planner**

---

## 1. Project Title
**GoalSlider AI**: An Intelligent Resource Optimizer and Goal-Based Roadmap Generator for Personalised Exam Preparation.

---

## 2. Introduction
In standard online education platforms, students are typically presented with a linear, comprehensive syllabus. However, when preparing for competitive exams under tight schedules, studying the entire syllabus is often inefficient. 

**GoalSlider AI** solves this by offering an interactive slider allowing students to set their desired target exam marks (from 0% to 100%). The backend recommendation engine ranks academic topics by their utility and selects the absolute minimum combination of topics, notes, videos, and practice tasks needed to achieve that target.

---

## 3. Problem Statement
Traditional exam preparation suffers from:
- **Information Overload**: Students waste hours on low-yield topics.
- **Fixed Syllabus Roads**: Traditional systems don't adapt to student weakness profiles dynamically.
- **Lack of Time-vs-Score Visibility**: Students cannot easily assess how much time they need to invest to increase their grade by a specific percentage.
- **Fragmented Tracking**: Lack of centralized multi-plan tracking to study for different target scores or exam types (Govt vs. Campus Placements) simultaneously.

---

## 4. Proposed Solution
An interactive dashboard built with a Next.js frontend, an intelligent scoring engine, and a secure Supabase backend:
- **Dynamic Trade-off Slider**: Real-time optimization showing expected marks vs syllabus coverage.
- **Customized Recommendation Engine**: Students can fine-tune what factors (PYQs, Weightage, Difficulty, Weakness) drive the algorithm.
- **User Authentication**: Secure JWT-based Login, Signup, and Password Reset UI.
- **Multi-Plan Database integration**: Save multiple target score roadmaps and resume studying anytime.
- **Live Progress Dashboard**: Track completion of Videos, PYQs, and Practice modules per topic, calculate streak counters, weekly activity, and unlock milestones.

---

## 5. Mathematical Scoring Engine
Topics are ranked dynamically using a weighted multi-criteria score:

$$\text{Topic Score} = (F_{\text{PYQ}} \times W_{\text{PYQ}}) + (M_{\text{Weight}} \times W_{\text{Weight}}) + ((10 - D) \times W_{\text{Diff}}) + (S_{\text{Weak}} \times W_{\text{Weak}})$$

Where:
- $F_{\text{PYQ}}$ = Previous Year Questions frequency (1 - 10)
- $M_{\text{Weight}}$ = Core exam weightage (Points out of 100)
- $D$ = Topic difficulty (1 - 10, inverted to prioritize easy scoring concepts)
- $S_{\text{Weak}}$ = Student weakness metric (1 - 10, highlighting custom weak areas)
- $W$ = Configurable weight coefficients (summing to 1.0)

---

## 6. Technical Architecture & Tech Stack
- **Frontend & Routing**: React 18, Next.js 14 (App Router), TypeScript.
- **Styling**: Tailwind CSS v3 with Glassmorphism variables, dark & light themes.
- **Animations**: Framer Motion.
- **Visualization**: Recharts (for live syllabus vs marks area curves and weekly activity logs).
- **Backend & DB**: Supabase (PostgreSQL Database, Auth, and Row Level Security).

---

## 7. Key Deliverables & UI Modules
1. **Ambition Optimizer Slider**: 0-100% slider updating metrics instantly.
2. **Double Area Curve Graph**: Interactive tooltip detailing cumulative syllabus and mark growth.
3. **Calibrator Control Panel**: Adjustable sliders to customize scoring weights.
4. **User Auth Suite**: Secure Login/Signup forms and Reset Password flow.
5. **Dashboard Portal**: Streaks, Weekly charts, Achievements, and Saved Plans list.
6. **Study Suite Simulator**: Stopwatch timer and checklist for Video, PYQ, and practice tasks per topic.
