<script lang="ts">
  /**
   * BrandTile — F22 brandmark tile for the hero section right side.
   *
   * Large rust-red rounded tile (~500×400px) with a cream barcode-style glyph
   * and a small cream dot in the bottom-right corner. Slightly rotated for
   * hand-drawn character per the design spec.
   *
   * @props class?: string — merged Tailwind classes
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let { class: className = '' }: { class?: string } = $props()

  // Barcode bars — deterministic heights, no Math.random()
  const bars = [
    { w: 8, h: 65, mb: 2 },
    { w: 4, h: 72, mb: 0 },
    { w: 12, h: 55, mb: 4 },
    { w: 2, h: 80, mb: 1 },
    { w: 6, h: 68, mb: 0 },
    { w: 16, h: 48, mb: 3 },
    { w: 4, h: 75, mb: 0 },
    { w: 10, h: 60, mb: 2 },
    { w: 3, h: 82, mb: 0 },
    { w: 14, h: 52, mb: 1 },
    { w: 6, h: 70, mb: 3 },
    { w: 20, h: 42, mb: 0 },
    { w: 2, h: 78, mb: 2 },
    { w: 8, h: 63, mb: 0 },
    { w: 12, h: 58, mb: 1 },
    { w: 4, h: 74, mb: 0 },
    { w: 18, h: 45, mb: 4 },
    { w: 6, h: 67, mb: 0 },
    { w: 2, h: 76, mb: 2 },
    { w: 10, h: 56, mb: 0 },
    { w: 16, h: 50, mb: 3 },
    { w: 4, h: 72, mb: 1 },
    { w: 12, h: 62, mb: 0 },
    { w: 3, h: 79, mb: 2 },
    { w: 8, h: 58, mb: 0 },
    { w: 14, h: 46, mb: 1 },
    { w: 2, h: 85, mb: 0 },
    { w: 6, h: 70, mb: 4 },
    { w: 20, h: 40, mb: 0 },
  ]
</script>

<div class={twMerge(clsx('relative flex items-center justify-center', className))}>
  <!-- Main tile: rust-red, rounded, subtle rotation for hand-drawn feel -->
  <div class="relative w-[min(42vw,500px)] h-[min(34vw,400px)] bg-pm-brand rounded-[22px] overflow-hidden shadow-2xl"
       style="transform: rotate(-0.8deg)">
    <!-- Barcode glyph: cream bars of varying widths, bottom-aligned, centered -->
    <div class="absolute inset-[15%] flex items-end justify-center gap-[2px]">
      {#each bars as bar}
        <div class="bg-[#F5ECDF] rounded-sm opacity-90 shrink-0"
             style="width: {bar.w}px; height: {bar.h}%; margin-bottom: {bar.mb}px">
        </div>
      {/each}
    </div>
    <!-- Small cream dot bottom-right -->
    <div class="absolute bottom-[12%] right-[12%] size-3 rounded-full bg-[#F5ECDF] opacity-80"></div>
  </div>
</div>
