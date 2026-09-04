'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  /** Filename inside /public/icons/, e.g. "memories-icon.png" */
  name: string
  /** Fallback emoji shown if the image file doesn't exist yet */
  fallback: string
  width?: number
  height?: number
  className?: string
  alt?: string
}

/**
 * Renders a custom image from /public/icons/<name> if it exists,
 * gracefully falling back to an emoji span.
 */
export default function CustomIcon({ name, fallback, width = 48, height = 48, className = '', alt }: Props) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return <span className={className} style={{ fontSize: width * 0.7 }}>{fallback}</span>
  }

  return (
    <Image
      src={`/icons/${name}`}
      alt={alt ?? fallback}
      width={width}
      height={height}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
