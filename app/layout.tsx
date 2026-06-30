import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GoalSlider AI | Smart Exam Prep Planner',
  description: 'AI-powered goal slider for intelligent government exam and placement preparation. Study smarter, not harder.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
