'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollProgressBarProps {
  height?: number // bar height in px, default 3
  colors?: string[] // gradient color stops, default rainbow gradient
  zIndex?: number // z-index stack level, default 9999
  smoothness?: number // smoothing factor (0-1), default 0.15 — lower is smoother but slightly less responsive
}

const defaultColors = [
  '#00CED1',
  '#4072ed',
  '#9370DB',
]


export default function ScrollProgressBar({
  height = 4,
  colors = defaultColors,
  zIndex = 9999,
  smoothness = 0.15,
}: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()

  // Store animation state in refs to avoid re-renders
  const rafIdRef = useRef<number | null>(null)
  const currentProgressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const lastScrollTimeRef = useRef(0)
  const isAnimatingRef = useRef(false)

  // Compute the target scroll progress
  const calculateTargetProgress = useCallback(() => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop

    const scrollableHeight = documentHeight - windowHeight

    if (scrollableHeight <= 0) {
      return { progress: 0, visible: false }
    }

    const scrollProgress = (scrollTop / scrollableHeight) * 100
    const clampedProgress = Math.min(Math.max(scrollProgress, 0), 100)

    return {
      progress: clampedProgress,
      visible: scrollTop > 0,
    }
  }, [])

  // Smooth animation via lerp (linear interpolation) toward the target progress
  const animateProgress = useCallback(() => {
    const now = performance.now()
    const timeSinceLastScroll = now - lastScrollTimeRef.current

    // Difference between current and target progress
    const diff = targetProgressRef.current - currentProgressRef.current

    // Stop animating once the difference is negligible and scrolling has been idle for 200ms
    if (Math.abs(diff) < 0.01 && timeSinceLastScroll > 200) {
      currentProgressRef.current = targetProgressRef.current
      setProgress(currentProgressRef.current)
      isAnimatingRef.current = false
      return
    }

    // Lerp toward the target
    currentProgressRef.current += diff * smoothness
    setProgress(currentProgressRef.current)

    // Keep animating
    rafIdRef.current = requestAnimationFrame(animateProgress)
  }, [smoothness])

  // Start the smooth animation
  const startAnimation = useCallback(() => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true
      animateProgress()
    }
  }, [animateProgress])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    lastScrollTimeRef.current = performance.now()

    const { progress: newProgress, visible } = calculateTargetProgress()
    targetProgressRef.current = newProgress
    setIsVisible(visible)

    // Start or continue the animation
    startAnimation()
  }, [calculateTargetProgress, startAnimation])

  // Handle window resize
  const handleResize = useCallback(() => {
    const { progress: newProgress, visible } = calculateTargetProgress()
    targetProgressRef.current = newProgress
    currentProgressRef.current = newProgress
    setProgress(newProgress)
    setIsVisible(visible)
  }, [calculateTargetProgress])

  // Listen for scroll and resize
  useEffect(() => {
    // Initialize
    const { progress: initialProgress, visible } = calculateTargetProgress()
    targetProgressRef.current = initialProgress
    currentProgressRef.current = initialProgress
    setProgress(initialProgress)
    setIsVisible(visible)

    // Throttle scroll events for better performance
    let scrollTimeout
    const throttledScroll = () => {
      clearTimeout(scrollTimeout)
      handleScroll()
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledScroll)
      window.removeEventListener('resize', handleResize)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [calculateTargetProgress, handleScroll, handleResize])

  // Reset on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      const { progress: newProgress, visible } = calculateTargetProgress()
      targetProgressRef.current = newProgress
      currentProgressRef.current = newProgress
      setProgress(newProgress)
      setIsVisible(visible)

      // Cancel any in-flight animation
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        isAnimatingRef.current = false
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, calculateTargetProgress])

  // Build the gradient color string
  const gradientColors = colors.join(', ')

  return (
    <div
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{ zIndex }}
      aria-hidden="true"
    >
      <div
        className="origin-left"
        style={{
          height: `${height}px`,
          width: `${progress}%`,
          background: `linear-gradient(to right, ${gradientColors})`,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 150ms ease-out',
          willChange: 'width',
          // We keep animating width (rather than transform) for an exact progress readout
          // even though transform-based animation would be slightly more performant.
        }}
      />
    </div>
  )
}
