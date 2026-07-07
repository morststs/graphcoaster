<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { game, getCurrentStage, getActiveCurves } from '../lib/gameState.svelte';
  import { advance } from '../lib/gameLoop';
  import { toPixel, MATH_MIN, MATH_MAX } from '../lib/coords';
  import { BALL_RADIUS } from '../lib/physics';

  let canvasEl: HTMLCanvasElement;
  let rafId = 0;
  let lastTime = 0;
  let resizeObserver: ResizeObserver | null = null;

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1;
    for (let v = MATH_MIN; v <= MATH_MAX; v += 1) {
      const { px: x0, py: y0 } = toPixel(v, MATH_MIN, w, h);
      const { px: x1, py: y1 } = toPixel(v, MATH_MAX, w, h);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const { px: hx0, py: hy0 } = toPixel(MATH_MIN, v, w, h);
      const { px: hx1, py: hy1 } = toPixel(MATH_MAX, v, w, h);
      ctx.beginPath();
      ctx.moveTo(hx0, hy0);
      ctx.lineTo(hx1, hy1);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 2;
    const origin = toPixel(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(0, origin.py);
    ctx.lineTo(w, origin.py);
    ctx.moveTo(origin.px, 0);
    ctx.lineTo(origin.px, h);
    ctx.stroke();
  }

  function draw() {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const w = canvasEl.width;
    const h = canvasEl.height;

    drawGrid(ctx, w, h);

    for (const curve of getActiveCurves()) {
      ctx.strokeStyle = curve.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const seg of curve.segments) {
        const p1 = toPixel(seg.a.x, seg.a.y, w, h);
        const p2 = toPixel(seg.b.x, seg.b.y, w, h);
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
      }
      ctx.stroke();
    }

    const stage = getCurrentStage();
    const dropPx = toPixel(stage.drop.x, stage.drop.y, w, h);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(dropPx.px, dropPx.py, 7, 0, Math.PI * 2);
    ctx.fill();

    for (const wp of game.waypoints) {
      const p = toPixel(wp.x, wp.y, w, h);
      ctx.fillStyle = wp.visited ? '#22c55e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.px, p.py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const ballPx = toPixel(game.ball.x, game.ball.y, w, h);
    const radiusPx = (BALL_RADIUS / (MATH_MAX - MATH_MIN)) * w;
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(ballPx.px, ballPx.py, radiusPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function frame(now: number) {
    const deltaSec = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    advance(deltaSec);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(rect.width * dpr);
    if (size > 0) {
      canvasEl.width = size;
      canvasEl.height = size;
    }
  }

  onMount(() => {
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasEl);
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
    resizeObserver?.disconnect();
  });
</script>

<canvas bind:this={canvasEl} class="aspect-square w-full rounded-lg bg-slate-900 shadow-lg"></canvas>
