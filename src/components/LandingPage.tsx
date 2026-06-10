import { useState, useEffect, useRef } from 'react'
import { animate, createDrawable, stagger, JSAnimation, createDraggable, createSpring, morphTo } from 'animejs'

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) { setProgress(1); return }
      setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref])

  return progress
}

const BIRD_PATHS = [
  [
    { x: -40, y: 30, r: -6, o: 0 }, { x: 20, y: 0, r: -12, o: 0.5 },
    { x: 100, y: -15, r: -15, o: 0.5 }, { x: 180, y: -5, r: -3, o: 0.5 },
    { x: 250, y: 20, r: 8, o: 0.5 }, { x: 200, y: 55, r: 12, o: 0.5 },
    { x: 100, y: 65, r: 5, o: 0.5 }, { x: 10, y: 50, r: -4, o: 0.5 },
    { x: -40, y: 30, r: -6, o: 0 },
  ],
  [
    { x: 310, y: 10, r: 5, o: 0 }, { x: 240, y: -10, r: 12, o: 0.45 },
    { x: 150, y: -18, r: 15, o: 0.45 }, { x: 70, y: -5, r: 6, o: 0.45 },
    { x: 15, y: 20, r: -5, o: 0.45 }, { x: 30, y: 55, r: -12, o: 0.45 },
    { x: 100, y: 68, r: -6, o: 0.45 }, { x: 200, y: 55, r: 3, o: 0.45 },
    { x: 310, y: 10, r: 5, o: 0 },
  ],
  [
    { x: 130, y: 72, r: 10, o: 0 }, { x: 170, y: 50, r: 16, o: 0.4 },
    { x: 215, y: 45, r: 8, o: 0.4 }, { x: 235, y: 60, r: -3, o: 0.4 },
    { x: 205, y: 78, r: -12, o: 0.4 }, { x: 150, y: 82, r: -8, o: 0.4 },
    { x: 110, y: 68, r: 0, o: 0.4 }, { x: 115, y: 58, r: 6, o: 0.4 },
    { x: 130, y: 72, r: 10, o: 0 },
  ],
]

function Birdie({ pathIdx, duration, size, delay }: {
  pathIdx: number; duration: number; size: number; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const path = BIRD_PATHS[pathIdx]
    const anim = animate(el, {
      keyframes: path.map(p => ({
        translateX: p.x, translateY: p.y, rotate: p.r, opacity: p.o,
      })),
      duration,
      ease: 'easeInOutSine',
      loop: true,
      delay,
    })
    return () => { anim.pause() }
  }, [])

  return (
    <div ref={ref} className="absolute pointer-events-none" style={{ opacity: 0 }}>
      <svg
        width={size}
        height={Math.round(size * 0.65)}
        viewBox="0 0 32 22"
        fill="none"
        style={{ filter: size < 20 ? 'blur(0.3px)' : 'none' }}
      >
        <rect x="5" y="4" width="22" height="13" rx="2" stroke="#533B3A" strokeWidth="0.9" fill="none" />
        <path d="M5 4 L16 11 L27 4" stroke="#533B3A" strokeWidth="0.7" fill="none" />
        <path d="M5 10 Q-3 1 4 5" stroke="#533B3A" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        <path d="M27 10 Q35 1 28 5" stroke="#533B3A" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        <circle cx="13" cy="1.5" r="1.5" fill="#533B3A" opacity="0.4" />
      </svg>
    </div>
  )
}

function HeroFlyingLetters() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      <Birdie pathIdx={0} duration={18000} size={24} delay={0} />
      <Birdie pathIdx={1} duration={22000} size={17} delay={7000} />
      <Birdie pathIdx={2} duration={16000} size={15} delay={12000} />
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
            opacity: 0.15,
            fontSize: `${12 + Math.random() * 16}px`,
          }}
        >
          {i % 3 === 0 ? '⌛' : i % 3 === 1 ? '✉' : '~'}
        </div>
      ))}
    </div>
  )
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
      {/* Background glow */}
      <ellipse cx="200" cy="200" rx="180" ry="160" fill="#533B3A" opacity="0.03" />
      <ellipse cx="200" cy="200" rx="120" ry="100" fill="#533B3A" opacity="0.03" />

      {/* Young child (left) */}
      <g transform="translate(80, 160)">
        {/* Body */}
        <path d="M30 60 Q35 30 50 20 Q65 30 70 60 L75 110 L25 110 Z" fill="#533B3A" opacity="0.15" />
        {/* Head */}
        <circle cx="50" cy="12" r="18" fill="#533B3A" opacity="0.12" />
        {/* Arm holding letter */}
        <path d="M70 50 Q90 45 105 55" stroke="#533B3A" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
        {/* Letter being handed */}
        <rect x="95" y="45" width="28" height="20" rx="2" stroke="#533B3A" strokeWidth="1.5" fill="#FDFCF9" opacity="0.7" />
        <line x1="98" y1="50" x2="108" y2="55" stroke="#533B3A" strokeWidth="0.8" opacity="0.3" />
        <line x1="120" y1="50" x2="110" y2="55" stroke="#533B3A" strokeWidth="0.8" opacity="0.3" />
      </g>

      {/* Older self (right) */}
      <g transform="translate(230, 140)">
        {/* Body - taller */}
        <path d="M25 80 Q30 40 50 25 Q70 40 75 80 L80 150 L20 150 Z" fill="#533B3A" opacity="0.15" />
        {/* Head */}
        <circle cx="50" cy="18" r="22" fill="#533B3A" opacity="0.12" />
        {/* Arm reaching for letter */}
        <path d="M25 60 Q10 55 0 50" stroke="#533B3A" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
      </g>

      {/* Time particles */}
      {[...Array(6)].map((_, i) => (
        <circle
          key={i}
          cx={60 + i * 50 + Math.random() * 20}
          cy={80 + Math.random() * 200}
          r="1.5"
          fill="#533B3A"
          opacity={0.08}
        />
      ))}

      {/* Curved time arrow */}
      <path
        d="M130 190 Q180 120 240 180"
        stroke="#533B3A"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.12"
        fill="none"
      />
      <circle cx="240" cy="178" r="3" fill="#533B3A" opacity="0.12" />

      {/* Floating paper fragments */}
      <rect x="50" y="50" width="8" height="6" rx="0.5" fill="#533B3A" opacity="0.06" transform="rotate(-15, 54, 53)" />
      <rect x="320" y="220" width="6" height="8" rx="0.5" fill="#533B3A" opacity="0.06" transform="rotate(25, 323, 224)" />
      <rect x="180" y="280" width="10" height="7" rx="0.5" fill="#533B3A" opacity="0.06" transform="rotate(-30, 185, 283)" />

      {/* Subtle clock motif */}
      <g transform="translate(340, 60)" opacity="0.06">
        <circle cx="0" cy="0" r="20" stroke="#533B3A" strokeWidth="1" fill="none" />
        <line x1="0" y1="0" x2="0" y2="-12" stroke="#533B3A" strokeWidth="1" />
        <line x1="0" y1="0" x2="8" y2="-4" stroke="#533B3A" strokeWidth="1" />
      </g>
    </svg>
  )
}

function HourglassIllustration({ progress }: { progress: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const topSandRef = useRef<SVGPathElement>(null)
  const bottomSandRef = useRef<SVGGElement>(null)
  const stream1Ref = useRef<SVGPathElement>(null)
  const stream2Ref = useRef<SVGPathElement>(null)
  const animsRef = useRef<JSAnimation[]>([])

  useEffect(() => {
    const stream1 = stream1Ref.current
    const stream2 = stream2Ref.current
    const container = containerRef.current
    const topSand = topSandRef.current
    const bottomSand = bottomSandRef.current

    const anims: JSAnimation[] = []

    const streamPaths = [stream1, stream2].filter(Boolean) as SVGPathElement[]
    if (streamPaths.length) {
      const drawables = createDrawable(streamPaths)
      const anim = animate(drawables, {
        draw: ['0 0', '0 1', '0 1'],
        delay: stagger(40),
        ease: 'easeInOutSine',
      })
      anim.pause()
      anims.push(anim)
    }

    if (container) {
      const anim = animate(container, { translateY: [0, -20], ease: 'easeInOutSine' })
      anim.pause()
      anims.push(anim)
    }

    if (topSand) {
      const anim = animate(topSand, { opacity: [0.18, 0], ease: 'easeInOutSine' })
      anim.pause()
      anims.push(anim)
    }

    if (bottomSand) {
      const anim = animate(bottomSand, { opacity: [0, 0.45], ease: 'easeInOutSine' })
      anim.pause()
      anims.push(anim)
    }

    animsRef.current = anims
    return () => anims.forEach(a => a.pause())
  }, [])

  useEffect(() => {
    animsRef.current.forEach(anim => anim.seek(anim.duration * progress))
  }, [progress])

  return (
    <div ref={containerRef}>
      <svg viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
        {/* Top frame */}
        <rect x="45" y="28" width="210" height="14" rx="3" stroke="#533B3A" strokeWidth="1.2" opacity="0.2" />
        <rect x="55" y="30" width="190" height="10" rx="2" stroke="#533B3A" strokeWidth="0.6" opacity="0.1" />

        {/* Bottom frame */}
        <rect x="45" y="378" width="210" height="14" rx="3" stroke="#533B3A" strokeWidth="1.2" opacity="0.2" />
        <rect x="55" y="380" width="190" height="10" rx="2" stroke="#533B3A" strokeWidth="0.6" opacity="0.1" />

        {/* Glass outline */}
        <path
          d="M70 52 C48 72 145 108 145 160 L145 240 C145 292 48 328 70 348 L230 348 C252 328 155 292 155 240 L155 160 C155 108 252 72 230 52 Z"
          stroke="#533B3A" strokeWidth="1.2" opacity="0.18" fill="none"
        />

        {/* Sand in top bulb — empties as user scrolls */}
        <path
          ref={topSandRef}
          d="M73 56 C55 72 142 102 142 155 L142 160 L148 160 L148 155 C148 110 148 105 100 70 C90 62 80 57 73 56 Z"
          fill="#A77A34" opacity="0.18"
        />

        {/* Sand stream — draws from top to bottom as user scrolls */}
        <path ref={stream1Ref} d="M145 160 L145 240" stroke="#A77A34" strokeWidth="2" opacity="0.55" fill="none" />
        <path ref={stream2Ref} d="M146 165 L146 240" stroke="#A77A34" strokeWidth="1" opacity="0.35" fill="none" />

        {/* Sand pile in bottom bulb — fills as user scrolls */}
        <g ref={bottomSandRef} opacity="0">
          <path d="M80 340 Q145 280 148 240 L220 340 C190 348 160 348 80 340 Z" fill="#A77A34" />
          <path d="M90 338 Q145 290 148 245 L210 338 C180 344 120 344 90 338 Z" fill="#A77A34" opacity="0.7" />
        </g>

        {/* Envelope 1 - partially buried in bottom sand */}
        <g transform="translate(105, 290) rotate(-12)" opacity="0.4">
          <rect x="0" y="0" width="28" height="18" rx="1.5" stroke="#533B3A" strokeWidth="1" fill="none" />
          <path d="M0 0 L14 10 L28 0" stroke="#533B3A" strokeWidth="0.7" fill="none" />
        </g>

        {/* Envelope 2 - resting in sand */}
        <g transform="translate(155, 300) rotate(8)" opacity="0.35">
          <rect x="0" y="0" width="24" height="16" rx="1.5" stroke="#533B3A" strokeWidth="1" fill="none" />
          <path d="M0 0 L12 9 L24 0" stroke="#533B3A" strokeWidth="0.7" fill="none" />
        </g>

        {/* Envelope 3 - higher up, nearly buried */}
        <g transform="translate(130, 275) rotate(5)" opacity="0.25">
          <rect x="0" y="0" width="20" height="14" rx="1.5" stroke="#533B3A" strokeWidth="0.9" fill="none" />
          <path d="M0 0 L10 7 L20 0" stroke="#533B3A" strokeWidth="0.6" fill="none" />
        </g>

        {/* Envelope floating in top bulb */}
        <g transform="translate(135, 90) rotate(15)" opacity="0.25">
          <rect x="0" y="0" width="22" height="15" rx="1.5" stroke="#533B3A" strokeWidth="0.9" fill="none" />
          <path d="M0 0 L11 8 L22 0" stroke="#533B3A" strokeWidth="0.6" fill="none" />
        </g>

        {/* Subtle particles */}
        <circle cx="100" cy="120" r="1.5" fill="#A77A34" opacity="0.1" />
        <circle cx="175" cy="105" r="1" fill="#A77A34" opacity="0.08" />
        <circle cx="120" cy="85" r="1.2" fill="#A77A34" opacity="0.1" />
        <circle cx="160" cy="270" r="1.5" fill="#A77A34" opacity="0.08" />
        <circle cx="115" cy="330" r="1" fill="#A77A34" opacity="0.1" />
      </svg>
    </div>
  )
}

function PadlockIllustration() {
  const padlockRef = useRef<SVGGElement>(null)
  const posRef = useRef({ x: 150, y: 155 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, pointerId: 0 })
  const releaseAnimRef = useRef<JSAnimation | null>(null)

  useEffect(() => {
    const el = padlockRef.current
    if (!el) return
    const state = dragRef.current

    const toViewBox = (clientX: number, clientY: number) => {
      const svg = el.closest('svg')!
      const rect = svg.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / rect.width * 300,
        y: (clientY - rect.top) / rect.height * 260,
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      releaseAnimRef.current?.pause()
      el.setPointerCapture(e.pointerId)
      state.pointerId = e.pointerId
      const vb = toViewBox(e.clientX, e.clientY)
      state.active = true
      state.startX = vb.x
      state.startY = vb.y
      state.origX = posRef.current.x
      state.origY = posRef.current.y
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!state.active) return
      const vb = toViewBox(e.clientX, e.clientY)
      posRef.current.x = state.origX + (vb.x - state.startX)
      posRef.current.y = state.origY + (vb.y - state.startY)
      el.setAttribute('transform', `translate(${posRef.current.x}, ${posRef.current.y})`)
    }

    const onPointerUp = () => {
      if (!state.active) return
      state.active = false
      el.releasePointerCapture(state.pointerId)

      releaseAnimRef.current = animate(posRef.current, {
        x: 150,
        y: 155,
        ease: createSpring({ stiffness: 120, damping: 6 }),
        onUpdate: () => {
          el.setAttribute('transform', `translate(${posRef.current.x}, ${posRef.current.y})`)
        },
      })
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      releaseAnimRef.current?.pause()
    }
  }, [])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <svg viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        {/* Envelope */}
        <g transform="translate(50, 40)">
          <rect x="0" y="0" width="200" height="140" rx="4" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="1.5" />
          <path d="M0 0 L100 70 L200 0" stroke="#E4E0D9" strokeWidth="1.5" fill="none" />
          <path d="M0 0 L100 70 L200 0" stroke="#E4E0D9" strokeWidth="0.5" fill="none" transform="translate(0, 2)" opacity="0.3" />
          {/* Seal */}
          <circle cx="100" cy="45" r="18" fill="#FDFCF9" stroke="#533B3A" strokeWidth="2" />
          <circle cx="100" cy="45" r="14" fill="none" stroke="#533B3A" strokeWidth="0.5" opacity="0.3" />
        </g>

        {/* Padlock */}
        <g ref={padlockRef} transform="translate(150, 155)" style={{ cursor: 'grab', touchAction: 'none' }}>
          {/* Shackle */}
          <path d="M-15 10 L-15 -15 Q-15 -35 5 -35 Q25 -35 25 -15 L25 10" stroke="#B8A87D" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Lock body */}
          <rect x="-18" y="8" width="46" height="38" rx="4" fill="#B8A87D" />
          <rect x="-15" y="11" width="40" height="32" rx="3" fill="#C4B78A" />
          {/* Keyhole */}
          <circle cx="5" cy="25" r="5" fill="#8B7A5E" />
          <path d="M2 28 L8 28 L7 36 L3 36 Z" fill="#8B7A5E" />
          {/* Glow */}
          <circle cx="5" cy="25" r="18" fill="#C4B78A" opacity="0.15" />
          <circle cx="5" cy="25" r="25" fill="#C4B78A" opacity="0.06" />
        </g>

        {/* "Not yet" caption */}
        <g transform="translate(130, 218)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontFamily="'Bodoni Moda', serif"
            fontSize="11"
            fontStyle="italic"
            fill="#533B3A"
            opacity="0.5"
          >
            Not yet.
          </text>
        </g>
      </svg>
    </div>
  )
}

function CountdownIllustration({ progress }: { progress: number }) {
  const totalMinutes = 120 * 24 * 60 + 13 * 60 + 42
  const remaining = totalMinutes * (1 - Math.min(1, Math.max(0, progress)))
  const days = Math.floor(remaining / (24 * 60))
  const hours = Math.floor((remaining % (24 * 60)) / 60)
  const minutes = Math.floor(remaining % 60)

  return (
    <div className="w-full max-w-sm mx-auto paper-card-elevated rounded-lg p-8 text-center">
      <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-accent/5 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#533B3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <circle cx="12" cy="12" r="6" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="12" x2="14" y2="12" />
        </svg>
      </div>
      <div className="flex justify-center gap-6 text-accent">
        <div>
          <div className="font-heading text-3xl tracking-wider tabular-nums animate-pulse-soft">{days}</div>
          <div className="text-xs tracking-widest uppercase mt-1 opacity-50">Days</div>
        </div>
        <div>
          <div className="font-heading text-3xl tracking-wider tabular-nums animate-pulse-soft">{hours}</div>
          <div className="text-xs tracking-widest uppercase mt-1 opacity-50">Hours</div>
        </div>
        <div>
          <div className="font-heading text-3xl tracking-wider tabular-nums animate-pulse-soft">{minutes}</div>
          <div className="text-xs tracking-widest uppercase mt-1 opacity-50">Minutes</div>
        </div>
      </div>
    </div>
  )
}

function EnvelopeMorphIllustration({ progress }: { progress: number }) {
  const flapRef = useRef<SVGPathElement>(null)
  const targetFlapRef = useRef<SVGPathElement>(null)
  const pagesRef = useRef<SVGGElement>(null)
  const lightRef = useRef<SVGGElement>(null)
  const raysRef = useRef<SVGGElement>(null)
  const animsRef = useRef<JSAnimation[]>([])

  useEffect(() => {
    const flap = flapRef.current
    const target = targetFlapRef.current
    const anims: JSAnimation[] = []

    if (flap && target) {
      const anim = animate(flap, {
        d: morphTo(target, 0.33),
        ease: 'linear',
      })
      anim.pause()
      anims.push(anim)
    }

    if (pagesRef.current) {
      const anim = animate(pagesRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        ease: 'easeOutQuad',
      })
      anim.pause()
      anims.push(anim)
    }

    if (lightRef.current) {
      const anim = animate(lightRef.current, {
        opacity: [0, 0.15],
        ease: 'easeOutQuad',
      })
      anim.pause()
      anims.push(anim)
    }

    if (raysRef.current) {
      const anim = animate(raysRef.current, {
        opacity: [0, 0.08],
        ease: 'easeOutQuad',
      })
      anim.pause()
      anims.push(anim)
    }

    animsRef.current = anims
    return () => anims.forEach(a => a.pause())
  }, [])

  useEffect(() => {
    animsRef.current.forEach(anim => anim.seek(anim.duration * progress))
  }, [progress])

  return (
    <svg viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      <g transform="translate(50, 60)">
        {/* Target path for morph (hidden) */}
        <path ref={targetFlapRef} d="M0 40 Q100 -20 200 40" visibility="hidden" />

        {/* Back flap */}
        <path d="M0 40 L100 100 L200 40" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="1" />
        {/* Front */}
        <rect x="0" y="40" width="200" height="120" rx="3" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="1" />
        {/* Animated flap: closed → open */}
        <path ref={flapRef} d="M0 0 Q50 25 100 40 Q150 25 200 0" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="1" />
        {/* Inner pages */}
        <g ref={pagesRef} opacity="0">
          <rect x="30" y="50" width="140" height="90" rx="1" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="0.5" />
          <line x1="45" y1="65" x2="155" y2="65" stroke="#E4E0D9" strokeWidth="0.5" opacity="0.5" />
          <line x1="45" y1="75" x2="140" y2="75" stroke="#E4E0D9" strokeWidth="0.5" opacity="0.5" />
          <line x1="45" y1="85" x2="145" y2="85" stroke="#E4E0D9" strokeWidth="0.5" opacity="0.5" />
          <line x1="45" y1="95" x2="130" y2="95" stroke="#E4E0D9" strokeWidth="0.5" opacity="0.5" />
          <line x1="45" y1="105" x2="150" y2="105" stroke="#E4E0D9" strokeWidth="0.5" opacity="0.5" />
        </g>
        {/* Light emerging from within */}
        <g ref={lightRef} opacity="0">
          <path d="M100 30 L80 10 L120 10 Z" fill="#A77A34" />
          <path d="M100 30 L60 0 L140 0 Z" fill="#A77A34" opacity="0.5" />
        </g>
      </g>
      {/* Light rays */}
      <g ref={raysRef} opacity="0">
        <path d="M150 100 L180 60 L185 65 Z" fill="#A77A34" />
        <path d="M150 100 L190 80 L192 86 Z" fill="#A77A34" />
        <path d="M150 100 L170 50 L176 54 Z" fill="#A77A34" />
      </g>
    </svg>
  )
}

function FloatingEnvelopesIllustration() {
  return (
    <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg mx-auto">
      {[...Array(12)].map((_, i) => {
        const x = 30 + i * 38 + (i % 3) * 10
        const y = 40 + (i % 5) * 50
        const size = 18 + (i % 3) * 8
        const rot = (i * 15) % 30 - 15
        return (
          <g key={i} transform={`translate(${x}, ${y}) rotate(${rot})`} opacity={0.3 - (i % 3) * 0.08}>
            <rect x="0" y="0" width={size} height={size * 0.7} rx="1.5" fill="#FDFCF9" stroke="#E4E0D9" strokeWidth="0.8" />
            <path d={`M0 0 L${size/2} ${size*0.35} L${size} 0`} stroke="#E4E0D9" strokeWidth="0.8" fill="none" />
          </g>
        )
      })}
    </svg>
  )
}

const useCases = [
  {
    title: "Future Self",
    description: "Write to the person you hope to become.",
  },
  {
    title: "Birthday Messages",
    description: "Schedule letters for meaningful days.",
  },
  {
    title: "Personal Promises",
    description: "Lock away commitments and revisit them later.",
  },
  {
    title: "Milestone Reflections",
    description: "Capture thoughts before life changes.",
  },
  {
    title: "Gratitude Notes",
    description: "Send appreciation into the future.",
  },
  {
    title: "Private Confessions",
    description: "Let difficult words rest before they are read.",
  },
]

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-24 md:py-32 px-6 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  )
}

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const pinnedRef = useRef<HTMLDivElement>(null)
  const pinnedProgress = useScrollProgress(pinnedRef)
  const countdownRef = useRef<HTMLDivElement>(null)
  const countdownProgress = useScrollProgress(countdownRef)
  const morphRef = useRef<HTMLDivElement>(null)
  const morphProgress = useScrollProgress(morphRef)

  return (
    <div className="paper-texture">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-heading text-lg tracking-tight text-accent">Time-Locked Letters</span>
          <button
            onClick={onEnterApp}
            className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
          >
            Open Archive
          </button>
        </div>
      </header>

      {/* HERO */}
      <Section className="pt-32 md:pt-40">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8">
            <FloatingParticles />
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight text-accent">
              Some words are meant for the future.
            </h1>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-md">
              Write a letter today.<br />
              Lock it away.<br />
              Read it when the moment finally arrives.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onEnterApp}
                className="px-8 py-3.5 bg-accent text-[#F7F4EF] rounded-lg font-medium text-sm tracking-wide hover:bg-accent-hover transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Create a Letter
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-3.5 border border-border text-accent rounded-lg font-medium text-sm tracking-wide hover:bg-accent/5 transition-all duration-300"
              >
                See How It Works
              </a>
            </div>
          </div>
          <div className="relative">
            <HeroFlyingLetters />
            <HeroIllustration />
          </div>
        </div>
      </Section>

      {/* SECTION 2 — Letters Travel Through Time (pinned scroll) */}
      <section
        ref={pinnedRef}
        id="how-it-works"
        className="relative bg-accent/ [background:radial-gradient(ellipse_at_center,_rgba(83,59,58,0.02)_0%,_transparent_70%)]"
        style={{ height: '400vh' }}
      >
        <div className="sticky top-0 h-screen flex items-center">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full max-w-6xl mx-auto px-6">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl leading-tight text-accent mb-6">
                Letters that wait.
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg max-w-md">
                Not every message belongs to today.<br />
                Some words need distance.<br />
                Some truths need time.
              </p>
            </div>
            <div className="relative">
              <HourglassIllustration progress={pinnedProgress} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Locked Until the Right Moment */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 md:order-1">
            <PadlockIllustration />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-heading text-3xl md:text-4xl leading-tight text-accent mb-6">
              Protected by time.
            </h2>
            <p className="text-text-secondary leading-relaxed text-lg max-w-md">
              Once sealed, a letter cannot be opened until its chosen date arrives.
            </p>
          </div>
        </div>
      </Section>

      {/* SECTION 4 — The Countdown (pinned scroll) */}
      <section
        ref={countdownRef}
        className="relative bg-accent/ [background:radial-gradient(ellipse_at_center,_rgba(83,59,58,0.02)_0%,_transparent_70%)]"
        style={{ height: '400vh' }}
      >
        <div className="sticky top-0 h-screen flex items-center">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full max-w-6xl mx-auto px-6">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl leading-tight text-accent mb-6">
                The wait becomes part of the experience.
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg max-w-md">
                Every letter carries its own countdown.<br />
                Days become weeks.<br />
                Weeks become months.<br />
                Eventually the future arrives.
              </p>
            </div>
            <div>
              <CountdownIllustration progress={countdownProgress} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — The Moment of Arrival (pinned scroll) */}
      <section
        ref={morphRef}
        className="relative"
        style={{ height: '400vh' }}
      >
        <div className="sticky top-0 h-screen flex items-center">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full max-w-6xl mx-auto px-6">
            <div className="order-2 md:order-1">
              <EnvelopeMorphIllustration progress={morphProgress} />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="font-heading text-3xl md:text-4xl leading-tight text-accent mb-6">
                Then one day it opens.
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg max-w-md">
                When the unlock date arrives, the seal breaks and the words finally reveal themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Use Cases */}
      <Section className="bg-accent/ [background:radial-gradient(ellipse_at_center,_rgba(83,59,58,0.02)_0%,_transparent_70%)]">
        <h2 className="font-heading text-3xl md:text-4xl text-center text-accent mb-16">
          Ways to wait.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc) => (
            <div key={uc.title} className="paper-card rounded-lg p-6 hover:paper-card-elevated transition-all duration-300 hover:-translate-y-1 group">
              <h3 className="font-heading text-xl text-accent mb-2 group-hover:opacity-80 transition-opacity">{uc.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{uc.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="mb-8">
            <FloatingEnvelopesIllustration />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl leading-tight text-accent">
            What would you tell the future?
          </h2>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Write it now.<br />
            Let time do the rest.
          </p>
          <button
            onClick={onEnterApp}
            className="px-10 py-4 bg-accent text-[#F7F4EF] rounded-lg font-medium text-sm tracking-wide hover:bg-accent-hover transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Create Your First Letter
          </button>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="font-heading text-lg text-accent">Time-Locked Letters</span>
            <nav className="flex gap-8 text-sm text-text-secondary">
              <a href="#" className="hover:text-accent transition-colors">Home</a>
              <a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a>
              <a href="#" className="hover:text-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent transition-colors">Contact</a>
            </nav>
          </div>
          <p className="text-center font-heading italic text-text-secondary/60 text-sm mt-8">
            "The future deserves a message."
          </p>
        </div>
      </footer>
    </div>
  )
}
