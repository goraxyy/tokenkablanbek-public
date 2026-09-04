import Navigation from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'
import PeonyAnimation from '@/components/PeonyAnimation'

const FLOWER_IMAGES = [
  '/images/home-flower-1.png',
  '/images/home-flower-2.png',
  '/images/home-flower-3.png',
  '/images/home-flower-4.png',
  '/images/home-flower-5.png',
  '/images/home-flower-6.png',
]

// NOTE: this layout used to do its own `supabase.auth.getSession()` check
// and redirect('/auth') on top of what middleware already does for every
// one of these routes. Two independent, separately-timed auth checks per
// request (one network-verified in middleware, one here) doubled the
// chances of a transient hiccup bouncing the user to /auth and added
// latency. middleware.ts is the single source of truth for route
// protection now; this layout just renders the shared app chrome.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #FFF0F5 0%, #FFD6E7 40%, #FFAECB 80%)',
      }}
    >
      {/* Falling flowers on every app page */}
      <PeonyAnimation count={12} burst={false} symbols={FLOWER_IMAGES} />
      <Navigation />
      <main className="pt-20 pb-12">{children}</main>
      <Toaster />
    </div>
  )
}
