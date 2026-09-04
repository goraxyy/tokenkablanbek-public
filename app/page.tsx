'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import PeonyAnimation from '@/components/PeonyAnimation'
import TypewriterText from '@/components/TypewriterText'
import { useRouter } from 'next/navigation'

const FLOWER_IMAGES = [
  '/images/home-flower-1.png',
  '/images/home-flower-2.png',
  '/images/home-flower-3.png',
  '/images/home-flower-4.png',
  '/images/home-flower-5.png',
  '/images/home-flower-6.png',
]

export default function LandingPage() {
  const router = useRouter()
  const [entering, setEntering] = useState(false)
  const [showPeonyBurst, setShowPeonyBurst] = useState(false)

  const handleEnter = () => {
    setShowPeonyBurst(true)
    setEntering(true)
    setTimeout(() => {
      router.push('/memories')
    }, 1800)
  }

  return (
    <AnimatePresence>
      {!entering ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0, backgroundColor: '#000000' }}
          animate={{ opacity: 1, backgroundColor: '#FFF0F5' }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFF0F5 0%, #FFD6E7 40%, #FFAECB 80%, #FF85A1 100%)',
          }}
        >
          {/* Floating peony animation */}
          <PeonyAnimation count={12} burst={showPeonyBurst} symbols={FLOWER_IMAGES} />

          {/* Main content */}
          <motion.div
            className="relative z-10 text-center px-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
          >
            {/* Decorative top */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.8, duration: 0.8, type: 'spring', stiffness: 120 }}
            >
              <Image src="/images/home-flower-1.png" alt="flower" width={72} height={72} style={{ width: '4.5rem', height: '4.5rem', objectFit: 'contain' }} />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-serif text-5xl md:text-7xl font-semibold mb-4"
              style={{ color: '#E75480' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 1 }}
            >
              Happy Birthday
            </motion.h1>

            {/* Typewriter message */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.8 }}
            >
              <TypewriterText
                text={`To the most wonderful person in my world \u2014 every moment with you is a gift I will treasure forever. \uD83D\uDC95`}
                className="font-serif italic text-lg md:text-xl text-peony-deep/80 leading-relaxed"
                delay={2800}
              />
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-sm text-peony-deep/60 mb-10 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 0.8 }}
            >
              A little piece of our story
            </motion.p>

            {/* Enter button */}
            <motion.button
              onClick={handleEnter}
              className="btn-primary text-lg px-10 py-4 font-serif italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4, duration: 0.8 }}
              whileHover={{ scale: 1.08, boxShadow: '0 12px 40px rgba(231,84,128,0.4)' }}
              whileTap={{ scale: 0.96 }}
            >
              Enter Our Story ✨
            </motion.button>
          </motion.div>

          {/* Bottom decoration */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.5, duration: 1 }}
          >
            {FLOWER_IMAGES.map((src, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Image src={src} alt="flower" width={32} height={32} style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="transitioning"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFD6E7 0%, #FFAECB 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PeonyAnimation count={30} burst symbols={FLOWER_IMAGES} />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Image src="/images/home-flower-1.png" alt="flower" width={96} height={96} style={{ width: '6rem', height: '6rem', objectFit: 'contain' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
