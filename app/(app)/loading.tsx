export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-5xl">🌸</div>
        <p className="text-peony-deep/50 text-sm font-medium">Loading…</p>
      </div>
    </div>
  )
}
