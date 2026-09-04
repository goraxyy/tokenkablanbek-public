'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Placeholder values in this public copy. The real deployment reads these
// from configuration.
//
// The counter is computed in a fixed local timezone rather than the viewer's,
// so "days together" reads the same on every device instead of shifting by one
// when someone opens the page from another timezone.
const TZ_OFFSET_MS = 0 * 60 * 60 * 1000
const TZ_LABEL = 'UTC'
const START_DATE = new Date(new Date('2020-01-01T00:00:00Z').getTime() - TZ_OFFSET_MS)

/** Returns the next anniversary of ANNIVERSARY_MONTH/DAY on or after now. */
function getNextAnniversary(): Date {
  const ANNIVERSARY_MONTH = 0 // January (0-indexed)
  const ANNIVERSARY_DAY = 1

  const nowLocal = new Date(Date.now() + TZ_OFFSET_MS)
  const thisYear = nowLocal.getUTCFullYear()

  // Build the candidate in UTC so it lands on local midnight of the day.
  const candidateUTC = new Date(
    Date.UTC(thisYear, ANNIVERSARY_MONTH, ANNIVERSARY_DAY) - TZ_OFFSET_MS
  )

  if (candidateUTC.getTime() <= Date.now()) {
    return new Date(
      Date.UTC(thisYear + 1, ANNIVERSARY_MONTH, ANNIVERSARY_DAY) - TZ_OFFSET_MS
    )
  }
  return candidateUTC
}

function useCountUp(start: Date) {
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = Date.now() - start.getTime()
      const totalSec = Math.max(0, Math.floor(diff / 1000))
      setElapsed({
        days: Math.floor(totalSec / 86400),
        hours: Math.floor((totalSec % 86400) / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [start])

  return elapsed
}

function useCountdown(to: Date) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = to.getTime() - Date.now()
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      const totalSec = Math.floor(diff / 1000)
      setRemaining({
        days: Math.floor(totalSec / 86400),
        hours: Math.floor((totalSec % 86400) / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [to])

  return remaining
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl glass flex items-center justify-center shadow-glass">
        <span className="font-serif text-3xl sm:text-4xl font-bold text-peony-deep">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-peony-deep/60 mt-2 uppercase tracking-wider">{label}</span>
    </motion.div>
  )
}

export default function TogetherClient() {
  const elapsed = useCountUp(START_DATE)

  const [nextAnniversary, setNextAnniversary] = useState(getNextAnniversary)
  useEffect(() => {
    const id = setInterval(() => setNextAnniversary(getNextAnniversary()), 60_000)
    return () => clearInterval(id)
  }, [])

  const countdown = useCountdown(nextAnniversary)

  // Display the start date in the configured timezone
  const startDisplayDate = new Date(START_DATE.getTime() + TZ_OFFSET_MS)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const anniversaryYear = new Date(nextAnniversary.getTime() + TZ_OFFSET_MS).getUTCFullYear()
  const yearsCount = anniversaryYear - new Date(START_DATE.getTime() + TZ_OFFSET_MS).getUTCFullYear()

  const totalDays = elapsed.days
  const stats = [
    { label: 'Sunrises shared', value: totalDays, icon: '🌅' },
    { label: 'Weeks together', value: Math.floor(totalDays / 7), icon: '🗓️' },
    { label: 'Months of love', value: Math.floor(totalDays / 30), icon: '💞' },
    { label: 'Heartbeats shared', value: (totalDays * 24 * 60 * 70).toLocaleString(), icon: '💓' },
  ]

  return (
    <div className="space-y-10">
      <motion.div
        className="card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-peony-deep/60 text-sm mb-2 uppercase tracking-widest">We've been together for</p>
        <div className="flex justify-center gap-3 sm:gap-6 my-6">
          <TimeUnit value={elapsed.days} label="Days" />
          <TimeUnit value={elapsed.hours} label="Hours" />
          <TimeUnit value={elapsed.minutes} label="Minutes" />
          <TimeUnit value={elapsed.seconds} label="Seconds" />
        </div>
        <p className="text-xs text-peony-deep/40">
          Since {startDisplayDate} · {TZ_LABEL}
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {stats.map((s) => (
          <div key={s.label} className="card text-center py-5">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-serif text-xl font-semibold text-peony-deep">{s.value}</div>
            <div className="text-xs text-peony-deep/50 mt-1">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="card text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-peony-deep/60 text-sm mb-2 uppercase tracking-widest">
          {yearsCount > 0 ? `${yearsCount}-year anniversary countdown` : 'Anniversary countdown'}
        </p>
        <div className="flex justify-center gap-3 sm:gap-6 my-6">
          <TimeUnit value={countdown.days} label="Days" />
          <TimeUnit value={countdown.hours} label="Hours" />
          <TimeUnit value={countdown.minutes} label="Minutes" />
          <TimeUnit value={countdown.seconds} label="Seconds" />
        </div>
        <p className="text-peony-deep/80 font-serif text-lg mt-2">
          🎉 {new Date(nextAnniversary.getTime() + TZ_OFFSET_MS).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </motion.div>
    </div>
  )
}
