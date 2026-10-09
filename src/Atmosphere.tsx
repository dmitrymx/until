import { useEffect, useRef } from 'react'

type Orb = {
  x: number
  y: number
  r: number
  hue: number
  alpha: number
  sx: number
  sy: number
}

const ORBS: Orb[] = [
  { x: 0.15, y: 0.2, r: 0.55, hue: 286, alpha: 0.62, sx: 0.17, sy: 0.11 },
  { x: 0.82, y: 0.18, r: 0.48, hue: 168, alpha: 0.55, sx: 0.13, sy: 0.16 },
  { x: 0.7, y: 0.78, r: 0.52, hue: 22, alpha: 0.58, sx: 0.11, sy: 0.09 },
  { x: 0.28, y: 0.72, r: 0.4, hue: 214, alpha: 0.5, sx: 0.19, sy: 0.14 },
  { x: 0.5, y: 0.45, r: 0.32, hue: 330, alpha: 0.42, sx: 0.22, sy: 0.18 },
]

export function Atmosphere() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let running = true

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.5
      canvas.width = Math.max(1, Math.floor(window.innerWidth * scale))
      canvas.height = Math.max(1, Math.floor(window.innerHeight * scale))
    }

    const paint = (time: number) => {
      const dark = document.documentElement.dataset.theme !== 'light'
      const width = canvas.width
      const height = canvas.height
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = dark ? '#07060b' : '#f3eee6'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'
      const speed = time * 0.00012
      for (const orb of ORBS) {
        const x = (orb.x + Math.sin(speed * orb.sx * 10 + orb.hue) * 0.22) * width
        const y = (orb.y + Math.cos(speed * orb.sy * 10 + orb.x * 6) * 0.2) * height
        const radius = orb.r * Math.max(width, height) * (0.82 + Math.sin(speed * 2 + orb.hue) * 0.16)
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
        const light = dark ? 62 : 58
        const alpha = dark ? orb.alpha : orb.alpha * 0.72
        glow.addColorStop(0, `hsla(${orb.hue}, 86%, ${light}%, ${alpha})`)
        glow.addColorStop(0.45, `hsla(${orb.hue + 12}, 80%, ${light}%, ${alpha * 0.35})`)
        glow.addColorStop(1, `hsla(${orb.hue}, 80%, 50%, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (time: number) => {
      if (!running) return
      paint(time)
      raf = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!running || reduce || document.visibilityState !== 'visible') return
      raf = requestAnimationFrame(loop)
    }

    resize()
    paint(0)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    if (!reduce) raf = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className="atmosphere" aria-hidden="true" />
}
