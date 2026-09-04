'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Petal {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  symbol: string
  isImage: boolean
}

interface PeonyAnimationProps {
  count?: number
  burst?: boolean
  /**
   * Override the default emoji/image symbols.
   * Each item can be:
   *   - An emoji string  e.g. '🌸'
   *   - An absolute or relative image URL / public path e.g. '/petals/rose.png'
   * Images are detected by the presence of '/' or 'http' in the string.
   */
  symbols?: string[]
  /**
   * burst mode only: how many times to fire the burst animation.
   * 0 = infinite (default). Use a positive number for a fixed count.
   */
  burstRepeat?: number
  /**
   * burst mode only: delay in ms between each burst wave. Default 2800 ms.
   */
  burstInterval?: number
}

const DEFAULT_SYMBOLS = ['🌸', '🌷', '🌹', '🌺', '🌼', '💐']

function isImageSrc(s: string) {
  return s.startsWith('/') || s.startsWith('http')
}

function PetalRenderer({ symbol, size, isImage }: { symbol: string; size: number; isImage: boolean }) {
  if (isImage) {
    return (
      <Image
        src={symbol}
        alt="petal"
        width={Math.round(size * 112)}
        height={Math.round(size * 112)}
        style={{ width: `${size * 4}rem`, height: `${size * 4}rem`, objectFit: 'contain' }}
        unoptimized
      />
    )
  }
  return <span style={{ fontSize: `${size * 4}rem` }}>{symbol}</span>
}

function makePetals(count: number, pool: string[], waveId: number): Petal[] {
  return Array.from({ length: count }, (_, i) => {
    const sym = pool[Math.floor(Math.random() * pool.length)]
    return {
      id: waveId * 1000 + i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 56 + Math.random() * 64,
      size: 1.2 + Math.random() * 2.8,
      symbol: sym,
      isImage: isImageSrc(sym),
    }
  })
}

function makeBurstPetals(count: number, pool: string[], waveId: number): Petal[] {
  return Array.from({ length: count * 3 }, (_, i) => {
    const sym = pool[Math.floor(Math.random() * pool.length)]
    return {
      id: waveId * 1000 + i,
      x: 20 + Math.random() * 60,
      delay: i * 0.04,
      duration: 12.8 + Math.random() * 6.4,
      size: 1.2 + Math.random() * 2.8,
      symbol: sym,
      isImage: isImageSrc(sym),
    }
  })
}

export default function PeonyAnimation({
  count = 288,
  burst = false,
  symbols,
  burstRepeat = 0,
  burstInterval = 2800,
}: PeonyAnimationProps) {
  const pool = symbols && symbols.length > 0 ? symbols : DEFAULT_SYMBOLS

  const [petals, setPetals] = useState<Petal[]>([])
  useEffect(() => {
    if (burst) return
    setPetals(makePetals(count, pool, 0))
  }, [count, burst, pool])

  const [wave, setWave] = useState(0)
  const [burstPetals, setBurstPetals] = useState<Petal[]>([])
  const [burstCount, setBurstCount] = useState(0)
  const [done, setDone] = useState(false)

  const effectiveBurstRepeat = burstRepeat > 0 ? burstRepeat * 4 : 0

  const fireBurst = useCallback(() => {
    setWave((w) => {
      const next = w + 1
      setBurstPetals(makeBurstPetals(count, pool, next))
      return next
    })
  }, [count, pool])

  useEffect(() => {
    if (!burst || done) return

    fireBurst()
    setBurstCount(1)

    if (effectiveBurstRepeat === 1) {
      setDone(true)
      return
    }

    const id = setInterval(() => {
      setBurstCount((c) => {
        const next = c + 1
        fireBurst()
        if (effectiveBurstRepeat > 0 && next >= effectiveBurstRepeat) {
          clearInterval(id)
          setDone(true)
        }
        return next
      })
    }, burstInterval)

    return () => clearInterval(id)
  }, [burst, done, effectiveBurstRepeat, burstInterval, fireBurst])

  if (burst) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
        <AnimatePresence>
          {burstPetals.map((petal) => {
            const launchX = (Math.random() - 0.5) * 600
            const peakY = -(200 + Math.random() * 300)
            const landY = 600 + Math.random() * 400
            const spin = 360 + Math.random() * 720
            return (
              <motion.div
                key={petal.id}
                className="absolute"
                style={{
                  left: `${petal.x}%`,
                  top: '60%',
                }}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1.4, 1.2, 0.9],
                  opacity: [0, 1, 1, 0.8, 0],
                  x: [0, launchX * 0.4, launchX],
                  y: [0, peakY, peakY * 0.2, landY],
                  rotate: [0, spin * 0.4, spin],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: petal.duration,
                  delay: petal.delay,
                  ease: [0.15, 0.9, 0.4, 1],
                  times: [0, 0.3, 0.55, 1],
                }}
              >
                <PetalRenderer symbol={petal.symbol} size={petal.size} isImage={petal.isImage} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute"
          style={{
            left: `${petal.x}%`,
            top: '-8%',
          }}
          animate={{
            y: ['0vh', '25vh', '115vh'],
            x: [0, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 480],
            rotate: [0, 180 + Math.random() * 180, 360 + Math.random() * 360],
            opacity: [0, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'easeIn',
            times: [0, 0.15, 0.7, 0.9, 1],
          }}
        >
          <PetalRenderer symbol={petal.symbol} size={petal.size} isImage={petal.isImage} />
        </motion.div>
      ))}
    </div>
  )
}