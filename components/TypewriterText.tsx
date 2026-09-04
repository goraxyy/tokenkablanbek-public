'use client'

import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
}

export default function TypewriterText({
  text,
  className = '',
  speed = 40,
  delay = 0,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return

    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)

    return () => clearTimeout(timeout)
  }, [started, displayed, text, speed])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="animate-pulse opacity-70">|</span>
      )}
    </span>
  )
}
