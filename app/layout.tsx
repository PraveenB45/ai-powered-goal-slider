import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Goal Slider | Study Planner',
  description: 'AI-powered goal slider dashboard for intelligent exam preparation.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
