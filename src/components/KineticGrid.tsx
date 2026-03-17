/**
 * KineticGrid — React Island
 * Canvas-based grid of points that warp on mouse proximity and ripple on click.
 * Ported from Key to the Rock's KineticGrid.jsx, adapted for portfolio palette.
 */

import { useRef, useEffect, useCallback } from 'react';

/* ── Tuning constants ── */
const CELL_SIZE = 40;
const INFLUENCE_RADIUS = 160;
const MAX_DISPLACEMENT = 14;
const POINT_LERP = 0.08;
const CURSOR_LERP = 0.12;
const RIPPLE_SPEED = 4;
const RIPPLE_MAX_RADIUS = 300;
const RIPPLE_STRENGTH = 20;
const RIPPLE_MAX_AGE = 90;
const RIPPLE_RING_WIDTH = 40;
const ALPHA_BUCKETS = 4;
const LINE_WIDTH_BASE = 0.5;
const LINE_WIDTH_PEAK = 1.0;
const OFF_SCREEN = -9999;

interface Point {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  tx?: number;
  ty?: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  age: number;
}

function getColors(isDark: boolean) {
  if (isDark) {
    return {
      r: 255, g: 255, b: 255,
      alphaBase: 0.02,
      alphaPeak: 0.12,
    };
  }
  return {
    r: 210, g: 191, b: 214,
    alphaBase: 0.08,
    alphaPeak: 0.35,
  };
}

function computeAlpha(dist: number, alphaBase: number, alphaPeak: number) {
  if (dist > INFLUENCE_RADIUS) return alphaBase;
  const t = dist / INFLUENCE_RADIUS;
  return alphaBase + (alphaPeak - alphaBase) * (1 - t * t);
}

function computeLineWidth(dist: number) {
  if (dist > INFLUENCE_RADIUS) return LINE_WIDTH_BASE;
  const t = dist / INFLUENCE_RADIUS;
  return LINE_WIDTH_BASE + (LINE_WIDTH_PEAK - LINE_WIDTH_BASE) * (1 - t * t);
}

export default function KineticGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: OFF_SCREEN, y: OFF_SCREEN });
  const smoothMouse = useRef({ x: OFF_SCREEN, y: OFF_SCREEN });
  const points = useRef<Point[]>([]);
  const grid = useRef({ cols: 0, rows: 0 });
  const ripples = useRef<Ripple[]>([]);
  const rafId = useRef<number>(0);
  const colorsRef = useRef(getColors(false));
  const sizeRef = useRef({ w: 0, h: 0 });
  const pausedRef = useRef(false);

  /* ── Track theme changes ── */
  useEffect(() => {
    const update = () => {
      colorsRef.current = getColors(document.documentElement.classList.contains('dark'));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  /* ── Build grid points ── */
  const buildGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    sizeRef.current = { w, h };

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.ceil(w / CELL_SIZE) + 3;
    const rows = Math.ceil(h / CELL_SIZE) + 3;
    const offsetX = -CELL_SIZE;
    const offsetY = -CELL_SIZE;
    const pts: Point[] = new Array(rows * cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = offsetX + c * CELL_SIZE;
        const by = offsetY + r * CELL_SIZE;
        pts[r * cols + c] = { baseX: bx, baseY: by, x: bx, y: by };
      }
    }

    points.current = pts;
    grid.current = { cols, rows };
  }, []);

  /* ── Resize ── */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(buildGrid, 150);
    };
    buildGrid();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [buildGrid]);

  /* ── Mouse + click listeners ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const onDown = (e: MouseEvent) => {
      ripples.current.push({ x: e.clientX, y: e.clientY, radius: 0, age: 0 });
    };
    const onLeave = () => {
      mouse.current.x = OFF_SCREEN;
      mouse.current.y = OFF_SCREEN;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  /* ── Animation loop ── */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas || pausedRef.current) {
        rafId.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId.current = requestAnimationFrame(animate); return; }
      const { w, h } = sizeRef.current;
      const { cols, rows } = grid.current;
      const pts = points.current;
      const c = colorsRef.current;
      if (!c || pts.length === 0) {
        rafId.current = requestAnimationFrame(animate);
        return;
      }

      /* 1. Smooth cursor */
      const sm = smoothMouse.current;
      const raw = mouse.current;
      sm.x += (raw.x - sm.x) * CURSOR_LERP;
      sm.y += (raw.y - sm.y) * CURSOR_LERP;
      const cx = sm.x;
      const cy = sm.y;

      /* 2. Reset targets to base positions */
      for (let i = 0; i < pts.length; i++) {
        pts[i].tx = pts[i].baseX;
        pts[i].ty = pts[i].baseY;
      }

      /* 3. Cursor displacement (only nearby points) */
      const cellRadius = Math.ceil(INFLUENCE_RADIUS / CELL_SIZE) + 1;
      const cursorCol = Math.floor((cx + CELL_SIZE) / CELL_SIZE);
      const cursorRow = Math.floor((cy + CELL_SIZE) / CELL_SIZE);
      const rMin = Math.max(0, cursorRow - cellRadius);
      const rMax = Math.min(rows, cursorRow + cellRadius + 1);
      const cMin = Math.max(0, cursorCol - cellRadius);
      const cMax = Math.min(cols, cursorCol + cellRadius + 1);

      for (let r = rMin; r < rMax; r++) {
        for (let col = cMin; col < cMax; col++) {
          const p = pts[r * cols + col];
          const dx = p.baseX - cx;
          const dy = p.baseY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > INFLUENCE_RADIUS || dist < 0.1) continue;
          const t = dist / INFLUENCE_RADIUS;
          const falloff = (1 - t * t) * (1 - t * t);
          const angle = Math.atan2(dy, dx);
          const disp = MAX_DISPLACEMENT * falloff;
          p.tx! += Math.cos(angle) * disp;
          p.ty! += Math.sin(angle) * disp;
        }
      }

      /* 4. Ripple displacement */
      for (let ri = ripples.current.length - 1; ri >= 0; ri--) {
        const rip = ripples.current[ri];
        rip.radius += RIPPLE_SPEED;
        rip.age += 1;
        if (rip.age >= RIPPLE_MAX_AGE) {
          ripples.current.splice(ri, 1);
          continue;
        }
        const ageFade = 1 - rip.age / RIPPLE_MAX_AGE;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const dx = p.baseX - rip.x;
          const dy = p.baseY - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ringDist = Math.abs(dist - rip.radius);
          if (ringDist > RIPPLE_RING_WIDTH) continue;
          const ringFalloff = 1 - ringDist / RIPPLE_RING_WIDTH;
          const mag = RIPPLE_STRENGTH * ringFalloff * ageFade;
          if (dist < 0.1) continue;
          const angle = Math.atan2(dy, dx);
          p.tx! += Math.cos(angle) * mag;
          p.ty! += Math.sin(angle) * mag;
        }
      }

      /* 5. Lerp positions */
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += (p.tx! - p.x) * POINT_LERP;
        p.y += (p.ty! - p.y) * POINT_LERP;
      }

      /* 6. Clear */
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      /* 7. Draw grid lines — bucketed by alpha */
      const maxAlpha = c.alphaPeak;
      const minAlpha = c.alphaBase;
      const alphaRange = maxAlpha - minAlpha;

      const buckets: number[][] = Array.from({ length: ALPHA_BUCKETS }, () => []);
      const widthBuckets = new Float32Array(ALPHA_BUCKETS);

      const assignBucket = (midX: number, midY: number, p1: Point, p2: Point) => {
        const dist = Math.hypot(midX - cx, midY - cy);
        const alpha = computeAlpha(dist, minAlpha, maxAlpha);
        const lw = computeLineWidth(dist);
        const idx = Math.min(
          ALPHA_BUCKETS - 1,
          Math.floor(((alpha - minAlpha) / (alphaRange || 1)) * ALPHA_BUCKETS)
        );
        buckets[idx].push(p1.x, p1.y, p2.x, p2.y);
        widthBuckets[idx] = Math.max(widthBuckets[idx], lw);
      };

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols - 1; col++) {
          const p1 = pts[r * cols + col];
          const p2 = pts[r * cols + col + 1];
          assignBucket((p1.x + p2.x) * 0.5, (p1.y + p2.y) * 0.5, p1, p2);
        }
      }
      for (let col = 0; col < cols; col++) {
        for (let r = 0; r < rows - 1; r++) {
          const p1 = pts[r * cols + col];
          const p2 = pts[(r + 1) * cols + col];
          assignBucket((p1.x + p2.x) * 0.5, (p1.y + p2.y) * 0.5, p1, p2);
        }
      }

      for (let b = 0; b < ALPHA_BUCKETS; b++) {
        const segs = buckets[b];
        if (segs.length === 0) continue;
        const alpha = minAlpha + ((b + 0.5) / ALPHA_BUCKETS) * alphaRange;
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(3)})`;
        ctx.lineWidth = widthBuckets[b] || LINE_WIDTH_BASE;
        ctx.beginPath();
        for (let i = 0; i < segs.length; i += 4) {
          ctx.moveTo(segs[i], segs[i + 1]);
          ctx.lineTo(segs[i + 2], segs[i + 3]);
        }
        ctx.stroke();
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  /* ── Visibility pause ── */
  useEffect(() => {
    const onVis = () => { pausedRef.current = document.hidden; };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -3,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
}
