'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/memories', label: 'Memories', icon: '/icons/memories-icon.svg' },
  { href: '/invite', label: 'Date Night', icon: '/icons/invite-icon.svg' },
  { href: '/together', label: 'Together', icon: '/icons/together-icon.svg' },
  { href: '/letters', label: 'Letters', icon: '/icons/letters-icon.svg' },
  { href: '/bucket-list', label: 'Bucket List', icon: '/icons/bucket-icon.svg' },
]

export default function Navigation() {
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // NOTE: we intentionally do NOT manually call router.prefetch() for every
  // nav item on mount here. Firing 5 simultaneous requests right as a page
  // loads can race with an in-flight Supabase access-token refresh (each
  // request tries to refresh the same soon-to-expire token; only one
  // refresh can win, so the others intermittently fail and can bounce the
  // user to /auth). Next.js's <Link prefetch> below already prefetches
  // each route lazily as it scrolls into view, which is enough.

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // A plain router.push() can leave the Next.js Router Cache serving
    // stale (still-authenticated) layout/page state, which makes Sign Out
    // look like it does nothing. Force a full hard navigation instead so
    // the browser and server both start clean.
    window.location.href = '/'
  }

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-glass py-3' : 'bg-transparent py-5'
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/memories" prefetch>
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Image
              src="/images/nav-logo.png"
              alt="Our Story"
              width={36}
              height={36}
              style={{ width: '2.25rem', height: '2.25rem', objectFit: 'contain' }}
            />
            <span className="font-serif text-xl font-semibold text-gradient hidden sm:block">
              Our Story
            </span>
          </motion.div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} prefetch>
              <motion.div
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  pathname === item.href
                    ? 'bg-peony-dark/20 text-peony-deep shadow-sm'
                    : 'text-peony-deep/70 hover:text-peony-deep hover:bg-peony-light/40'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={20}
                  height={20}
                  style={{ width: '1.25rem', height: '1.25rem', objectFit: 'contain' }}
                />
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full bg-peony-dark/10"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Sign out + mobile menu */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-1.5 text-sm text-peony-deep/60 hover:text-peony-deep px-3 py-2 rounded-full hover:bg-peony-light/40 transition"
            whileHover={{ scale: 1.05 }}
          >
            <Image
              src="/icons/log-out.svg"
              alt="Sign Out"
              width={18}
              height={18}
              style={{ width: '1.125rem', height: '1.125rem', objectFit: 'contain' }}
            />
            Sign Out
          </motion.button>

          <button
            className="md:hidden p-2 rounded-full hover:bg-peony-light/40 transition"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden glass mx-4 mt-2 rounded-2xl overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-4 px-4 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    prefetch
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      pathname === item.href
                        ? 'bg-peony-dark/20 text-peony-deep'
                        : 'text-peony-deep/70 hover:bg-peony-light/40 hover:text-peony-deep'
                    }`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={24}
                      height={24}
                      style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }}
                    />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-peony-deep/60 hover:bg-peony-light/40 hover:text-peony-deep transition mt-1"
              >
                <Image
                  src="/icons/log-out.svg"
                  alt="Sign Out"
                  width={24}
                  height={24}
                  style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }}
                />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
