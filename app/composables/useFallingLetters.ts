/**
 * useFallingLetters
 * Chaos → Order: random numbers fall, then 1s & 0s form terminal-like rows.
 * Non-binary digits fly away. Symbolizes "from chaos we make order."
 */

import Matter from 'matter-js'

interface FallingLettersOptions {
  canvasRef: globalThis.Ref<HTMLCanvasElement | null>
  enabled?: boolean
}

const NUMS = '0123456789'
const SYMS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
const FONTS = ['Geologica', 'Heebo']
const BODY_COUNT = 400

function rnd(a: number, b: number): number { return a + Math.random() * (b - a) }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function parseRGB(s: string): { r: number; g: number; b: number } | null {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return { r: +m[1], g: +m[2], b: +m[3] }
  const h = s.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (h) return { r: Number.parseInt(h[1], 16), g: Number.parseInt(h[2], 16), b: Number.parseInt(h[3], 16) }
  return null
}
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number): number { return v < lo ? lo : v > hi ? hi : v }

interface LetterItem {
  char: string; fs: number; fw: number; ff: string; gr: number
  cx: number; cy: number; ca: number
  tx: number; ty: number; ta: number
  inShape: boolean
}

export function useFallingLetters(opts: FallingLettersOptions) {
  const { canvasRef, enabled = true } = opts
  if (!enabled) return { refresh() {}, pause() {}, resume() {} }

  let engine: Matter.Engine | null = null
  let runner: Matter.Runner | null = null
  let dataMap = new Map<number, LetterItem>()
  let staged: LetterItem[] = []
  let rid = 0; let dead = false
  let spawnCount = 0; let spawnDone = false; let captured = false
  let vw = 0; let vh = 0; let cr = 128; let cg = 128; let cb = 128; let colorCacheKey = ''
  let cachedGrid: HTMLCanvasElement | null = null

  function resize(): void {
    const c = canvasRef.value; if (!c) return
    const dpr = window.devicePixelRatio || 1
    vw = window.innerWidth; vh = window.innerHeight
    if (c.width !== vw * dpr || c.height !== vh * dpr) {
      c.width = vw * dpr; c.height = vh * dpr
      cachedGrid = null
      c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }

  function updateColor(): void {
    const bg = parseRGB(getComputedStyle(document.body).backgroundColor)
    if (!bg) return
    const key = `${bg.r},${bg.g},${bg.b}`
    if (key === colorCacheKey) return
    colorCacheKey = key
    cachedGrid = null // invalidate on theme change

    // Read brand color for tint (avoids flat gray look)
    const brandRaw = getComputedStyle(document.documentElement).getPropertyValue('--p-brand').trim()
    const brand = parseRGB(brandRaw) ?? { r: 170, g: 0, b: 0 }

    const avg = (bg.r + bg.g + bg.b) / 3
    if (avg > 128) {
      cr = Math.round(bg.r * 0.90 + brand.r * 0.05)
      cg = Math.round(bg.g * 0.90 + brand.g * 0.05)
      cb = Math.round(bg.b * 0.90 + brand.b * 0.05)
    } else {
      cr = Math.round(bg.r * 0.5)
      cg = Math.round(bg.g * 0.5)
      cb = Math.round(bg.b * 0.5)
    }
  }

  function init(): void {
    engine = Matter.Engine.create({ enableSleeping: true })
    runner = Matter.Runner.create()
    Matter.Runner.run(runner, engine)
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(vw / 2, vh, vw * 3, 80, { isStatic: true }))
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(-40, vh / 2, 80, vh * 3, { isStatic: true }))
    Matter.Composite.add(engine.world, Matter.Bodies.rectangle(vw + 40, vh / 2, 80, vh * 3, { isStatic: true }))
    spawnCount = 0; spawnDone = false; captured = false
    staged = []; dataMap = new Map()
  }

  function spawn(): void {
    if (!engine || spawnCount >= BODY_COUNT) { spawnDone = true; return }
    // Chaos: ~30% 0/1 for final binary grid
    const r = Math.random()
    const ch = r < 0.3 ? pick(['0', '1']) : r < 0.55 ? pick((NUMS + SYMS).split('')) : pick(NUMS.split(''))
    const fs = rnd(80, 425)
    const bw = fs * 0.15
    const body = Matter.Bodies.rectangle(
      rnd(40, vw - 40), -(rnd(50, 1500)),
      Math.max(3, bw), Math.max(8, fs),
      { restitution: 0, friction: 0.5, frictionAir: 0.02, density: 0.001 }
    )
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: rnd(0, 5) })
    dataMap.set(body.id, {
      char: ch, fs, fw: Math.floor(rnd(100, 900)), ff: pick(FONTS),
      gr: (Math.random() > 0.5 ? 1 : -1) * rnd(0.05, 0.8),
      cx: 0, cy: 0, ca: 0, tx: 0, ty: 0, ta: 0, inShape: false
    })
    Matter.Composite.add(engine.world, body)
    spawnCount++
  }

  function captureAndBuildTargets(): void {
    if (!engine) return
    const bodies = Matter.Composite.allBodies(engine.world)
    for (const b of bodies) {
      if (b.isStatic) continue
      const d = dataMap.get(b.id); if (!d) continue
      d.cx = b.position.x; d.cy = b.position.y; d.ca = b.angle
      staged.push(d)
    }
    if (runner) { Matter.Runner.stop(runner); runner = null }
    Matter.Engine.clear(engine); engine = null

    const binary: LetterItem[] = []
    const other: LetterItem[] = []
    for (const s of staged) {
      if (s.char === '0' || s.char === '1') binary.push(s)
      else other.push(s)
    }

    // Auto-calculate font size — wider spacing so each digit is clearly visible
    const padX = 0; const padY = 100
    const availW = vw - padX * 2
    const availH = vh - padY * 2
    const count = binary.length
    const binFs = Math.round(Math.sqrt(availH * availW / (0.075 * count)))
    const charW = binFs * 0.45
    const rowH = binFs * 0.7
    const cols = Math.max(1, Math.floor(availW / charW))
    const rows = Math.ceil(count / cols)
    const gridH = rows * rowH
    const startY = (vh - gridH) / 2 + rowH / 2

    let bi = 0
    for (let row = 0; row < rows && bi < count; row++) {
      const y = startY + row * rowH
      const thisRow = Math.min(cols, count - bi)
      const rowStartX = (vw - thisRow * charW) / 2 + charW / 2
      for (let col = 0; col < thisRow; col++) {
        binary[bi].tx = rowStartX + col * charW
        binary[bi].ty = y
        binary[bi].fs = binFs
        binary[bi].fw = 700
        binary[bi].ta = 0
        binary[bi].inShape = true
        bi++
      }
    }

    // Fly away non-binary — scatter in all directions
    for (const s of other) {
      const a = Math.random() * Math.PI * 2
      const dist = vw * 2
      s.tx = s.cx + Math.cos(a) * dist
      s.ty = s.cy + Math.sin(a) * dist
      s.ta = s.ca * 3
      s.inShape = false
    }
    captured = true
  }

  function draw(ctx: CanvasRenderingContext2D): void {
    updateColor()
    ctx.clearRect(0, 0, vw, vh)
    const sy = window.scrollY; ctx.textBaseline = 'top'

    if (captured) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
      const start = maxScroll * 0.4
      const range = maxScroll * 0.45
      const t = clamp((sy - start) / range, 0, 1)

      // After morph complete: use cached pre-render for massive perf boost
      if (t >= 1) {
        if (!cachedGrid) {
          cachedGrid = document.createElement('canvas')
          cachedGrid.width = vw * (window.devicePixelRatio || 1)
          cachedGrid.height = vh * (window.devicePixelRatio || 1)
          const gctx = cachedGrid.getContext('2d')
          if (gctx) {
            gctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
            gctx.textAlign = 'center'
            gctx.textBaseline = 'middle'
            for (const s of staged) {
              if (!s.inShape) continue
              gctx.font = `${s.fw} ${s.fs}px "${s.ff}", sans-serif`
              gctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 1)`
              gctx.fillText(s.char, s.tx, s.ty)
            }
          }
        }
        ctx.drawImage(cachedGrid, 0, 0, vw, vh)
        return
      }

      // Morph in progress: individual render with tight culling
      for (const s of staged) {
        const x = lerp(s.cx, s.tx, t)
        const y = lerp(s.cy, s.ty, t)
        const a = lerp(s.ca, s.ta, t) + (s.inShape ? 0 : sy * s.gr * 0.0003)
        const opacity = s.inShape ? 1 : clamp(1 - (t - 0.65) / 0.35, 0, 1)
        if (opacity <= 0.01) continue
        if (y < -150 || y > vh + 150 || x < -150 || x > vw + 150) continue
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a)
        ctx.font = `${s.fw} ${s.fs}px "${s.ff}", sans-serif`
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${opacity})`
        if (s.inShape) {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
        }
        ctx.fillText(s.char, 0, 0)
        ctx.restore()
      }
    } else if (engine) {
      const bodies = Matter.Composite.allBodies(engine.world)
      for (const b of bodies) {
        if (b.isStatic) continue
        const d = dataMap.get(b.id); if (!d) continue
        if (b.position.y < -200 || b.position.y > vh + 200) continue
        ctx.save(); ctx.translate(b.position.x, b.position.y)
        ctx.rotate(b.angle + sy * d.gr * 0.0008)
        ctx.font = `${d.fw} ${d.fs}px "${d.ff}", sans-serif`
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 1)`
        ctx.fillText(d.char, 0, 0); ctx.restore()
      }
    }
  }

  function tick(): void {
    if (dead) return
    const c = canvasRef.value; if (!c) { rid = requestAnimationFrame(tick); return }
    const ctx = c.getContext('2d'); if (!ctx) { rid = requestAnimationFrame(tick); return }
    resize()

    if (!spawnDone && engine) spawn()

    if (spawnDone && !captured && engine && window.scrollY > 10) {
      captureAndBuildTargets()
    }
    if (spawnDone && !captured && engine) {
      const bodies = Matter.Composite.allBodies(engine.world)
      const allSleeping = bodies.every(b => b.isStatic || b.isSleeping)
      if (allSleeping && bodies.length - 3 > 0) {
        captureAndBuildTargets()
      }
    }

    draw(ctx)
    rid = requestAnimationFrame(tick)
  }

  onMounted(() => {
    if (!import.meta.client) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    resize(); init()
    document.addEventListener('visibilitychange', () => { dead = document.hidden })
    rid = requestAnimationFrame(tick)
  })

  onUnmounted(() => {
    dead = true; cancelAnimationFrame(rid)
    if (runner) Matter.Runner.stop(runner)
    if (engine) Matter.Engine.clear(engine)
  })

  return { refresh() {}, pause() {}, resume() {} }
}
