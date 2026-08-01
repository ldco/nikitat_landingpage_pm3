<script lang="ts">
  /**
   * FallingLetters — Matter.js physics animation (Chaos → Order)
   *
   * Isolated component (Rule #4): handles $effect cleanup (.destroy()).
   * NEVER import Matter.js in pages — use this pre-built component.
   *
   * Renders 400+ digit/symbol bodies that fall chaotically then settle
   * into ordered rows. Canvas-rendered behind content.
   *
   * Respects prefers-reduced-motion (renders static ordered state).
   *
   * Rule #1: class prop + twMerge
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { onMount } from 'svelte'
  import Matter from 'matter-js'

  let {
    enabled = true,
    class: className = ''
  }: {
    enabled?: boolean
    class?: string
  } = $props()

  let canvas = $state.raw() as HTMLCanvasElement
  let container = $state.raw() as HTMLDivElement
  let engine: Matter.Engine | null = null
  let runner: Matter.Runner | null = null

  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+*/=<>|&%$#@!'
  const COUNT = 400

  onMount(() => {
    if (!enabled) {
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    if (w === 0 || h === 0) return

    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // ── Physics engine ───────────────────────────────────────────────
    engine = Matter.Engine.create({
      enableSleeping: true,
      gravity: { x: 0, y: 0.5, scale: 0.001 }
    })
    runner = Matter.Runner.create()

    const wallThickness = 40
    const walls = [
      Matter.Bodies.rectangle(w / 2, -wallThickness / 2, w + 200, wallThickness, { isStatic: true }), // top
      Matter.Bodies.rectangle(w / 2, h + wallThickness / 2, w + 200, wallThickness, { isStatic: true }), // bottom
      Matter.Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h + 200, { isStatic: true }), // left
      Matter.Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h + 200, { isStatic: true }) // right
    ]
    Matter.Composite.add(engine.world, walls)

    // ── Letter bodies ────────────────────────────────────────────────
    const fontSize = 14
    const cols = Math.floor(w / (fontSize * 1.2))
    const rows = Math.floor(h / (fontSize * 1.5))
    const cellW = w / cols
    const cellH = h / rows
    const totalBodies = Math.min(COUNT, cols * rows)

    const bodyData: Array<{ body: Matter.Body; char: string; targetX: number; targetY: number }> = []

    for (let i = 0; i < totalBodies; i++) {
      const char = CHARS.charAt(Math.floor(Math.random() * CHARS.length))
      const col = i % cols
      const row = Math.floor(i / cols)

      // Target position (ordered grid)
      const targetX = col * cellW + cellW / 2
      const targetY = row * cellH + cellH / 2

      // Random starting position (chaos)
      const startX = Math.random() * w * 1.2 - w * 0.1
      const startY = Math.random() * h * 0.5 - h * 0.5

      const body = Matter.Bodies.rectangle(startX, startY, fontSize, fontSize * 1.4, {
        friction: 0.1,
        frictionAir: 0.02,
        restitution: 0.3,
        density: 0.001
      })

      bodyData.push({ body, char, targetX, targetY })
      Matter.Composite.add(engine.world, body)
    }

    // ── Render loop ─────────────────────────────────────────────────
    function render() {
      if (!ctx || !engine) return
      ctx.clearRect(0, 0, w, h)

      for (const { body, char, targetX, targetY } of bodyData) {
        const pos = body.position
        const angle = body.angle
        const distToTarget = Math.hypot(pos.x - targetX, pos.y - targetY)

        // Settled bodies are more visible
        const settled = distToTarget < 5
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.rotate(angle)
        ctx.font = `${fontSize}px Geologica, monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.globalAlpha = settled ? 0.15 : 0.08
        ctx.fillStyle = 'currentColor'
        ctx.fillText(char, 0, 0)
        ctx.restore()
      }
    }

    // ── Run ──────────────────────────────────────────────────────────
    let cleanup: (() => void) | undefined

    if (reduced) {
      // Static render at target positions (no physics needed)
      ctx.clearRect(0, 0, w, h)
      ctx.font = `${fontSize}px Geologica, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.15
      ctx.fillStyle = 'currentColor'

      for (const { char, targetX: tx, targetY: ty } of bodyData) {
        ctx.fillText(char, tx, ty)
      }
    } else {
      if (runner) Matter.Runner.run(runner, engine)

      let animFrame = requestAnimationFrame(function loop() {
        render()
        animFrame = requestAnimationFrame(loop)
      })

      cleanup = () => {
        cancelAnimationFrame(animFrame)
        if (engine) {
          Matter.Engine.clear(engine)
          engine = null
        }
        if (runner) {
          Matter.Runner.stop(runner)
          runner = null
        }
      }
    }

    return cleanup
  })
</script>

{#if enabled}
  <div
    bind:this={container}
    class={twMerge(clsx('relative w-full h-full pointer-events-none overflow-hidden', className))}
  >
    <canvas
      bind:this={canvas}
      class="absolute inset-0 w-full h-full"
      aria-hidden="true"
    ></canvas>
  </div>
{/if}
