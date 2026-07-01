import { useEffect, useRef } from 'react'

export default function WaterGlass({ percent }) {
  const clamped = Math.max(0, Math.min(1, percent))
  // We animate waterTop via a ref so React doesn't re-render every frame
  const rectRef  = useRef(null)
  const wavePath = useRef(null)
  const shineRef = useRef(null)
  const targetRef = useRef(clamped)
  const currentRef = useRef(clamped)
  const rafRef = useRef(null)

  // y position from 0-based percent: 228 (empty) down to 28 (full)
  const toY = (p) => 228 - p * 200

  useEffect(() => {
    targetRef.current = clamped
    if (rafRef.current) return // already animating

    const tick = () => {
      const cur = currentRef.current
      const target = targetRef.current
      const diff = target - cur

      if (Math.abs(diff) < 0.001) {
        currentRef.current = target
        rafRef.current = null
        applyY(target)
        return
      }
      // Ease toward target (spring-like)
      const next = cur + diff * 0.07
      currentRef.current = next
      applyY(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    const applyY = (p) => {
      const y = toY(p)
      if (rectRef.current) {
        rectRef.current.setAttribute('y', y)
        // Keep the SVG animate synced: remove/re-add values attr
        const anim = rectRef.current.querySelector('animate')
        if (anim) {
          anim.setAttribute('values', `${y+3};${y};${y+3}`)
        }
      }
      if (wavePath.current) {
        const waveAnim = wavePath.current.querySelector('animate')
        const d1 = `M20 ${y} Q60 ${y-7} 100 ${y} T180 ${y}`
        const d2 = `M20 ${y} Q60 ${y+7} 100 ${y} T180 ${y}`
        wavePath.current.setAttribute('d', d1)
        if (waveAnim) waveAnim.setAttribute('values', `${d1};${d2};${d1}`)
      }
      if (shineRef.current) {
        shineRef.current.setAttribute('cy', y + 30)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [clamped])

  const initY = toY(clamped)

  return (
    <svg viewBox="0 0 200 260" className="glass-svg" role="img"
      aria-label={`Glass ${Math.round(clamped * 100)} percent full`}>
      <defs>
        <clipPath id="glassClip">
          <path d="M38 18 L162 18 L147 242 Q100 256 53 242 Z" />
        </clipPath>
        <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#80d8e8" />
          <stop offset="100%" stopColor="#00aecc" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
          <stop offset="40%"  stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
        </linearGradient>
      </defs>

      {/* glass body fill */}
      <path d="M38 18 L162 18 L147 242 Q100 256 53 242 Z"
        fill="url(#glassGrad)"
        stroke="rgba(0,130,160,0.25)"
        strokeWidth="2"
      />

      {/* water, clipped */}
      <g clipPath="url(#glassClip)">
        <rect ref={rectRef} x="20" y={initY} width="160" height="280" fill="url(#waterFill)">
          <animate attributeName="y"
            values={`${initY+3};${initY};${initY+3}`}
            dur="4s" repeatCount="indefinite" />
        </rect>
        <path ref={wavePath}
          d={`M20 ${initY} Q60 ${initY-7} 100 ${initY} T180 ${initY}`}
          fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
          <animate attributeName="d"
            values={`M20 ${initY} Q60 ${initY-7} 100 ${initY} T180 ${initY};M20 ${initY} Q60 ${initY+7} 100 ${initY} T180 ${initY};M20 ${initY} Q60 ${initY-7} 100 ${initY} T180 ${initY}`}
            dur="3s" repeatCount="indefinite" />
        </path>
        <ellipse ref={shineRef} cx="75" cy={initY + 30} rx="10" ry="5"
          fill="rgba(255,255,255,0.22)" transform="rotate(-20 75 140)" />
      </g>

      {/* glass outline over water */}
      <path d="M38 18 L162 18 L147 242 Q100 256 53 242 Z"
        fill="none"
        stroke="rgba(0,130,160,0.3)"
        strokeWidth="2"
      />
      {/* rim */}
      <line x1="38" y1="18" x2="162" y2="18"
        stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
      {/* left shine */}
      <path d="M52 40 Q48 100 55 180"
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
