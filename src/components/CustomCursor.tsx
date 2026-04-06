/**
 * CustomCursor — Chromatic Velocity + Beacon
 * Three chromatic aberration dots that fan apart and stretch with movement velocity.
 * A beacon ring is always present and fades out on interactive hover.
 * Toggle on/off with the L key.
 */

import { useRef, useEffect, useState, useCallback } from 'react';

const LERP = (a: number, b: number, t: number) => a + (b - a) * t;

export default function CustomCursor() {
  const [canHover, setCanHover] = useState(false);
  const [enabled, setEnabled]   = useState(true);
  const [isDark, setIsDark]     = useState(false);

  // Chromatic trail dots
  const pinkRef  = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const blueRef  = useRef<HTMLDivElement>(null);
  const pinkPos  = useRef({ x: -200, y: -200 });
  const whitePos = useRef({ x: -200, y: -200 });
  const bluePos  = useRef({ x: -200, y: -200 });

  // Beacon ring
  const beaconRef = useRef<HTMLDivElement>(null);
  const beaconPos = useRef({ x: -200, y: -200 });

  const mouse      = useRef({ x: -200, y: -200 });
  const prevMouse  = useRef({ x: -200, y: -200 });
  const rafId      = useRef(0);
  const hovering   = useRef(false);
  const frameCount = useRef(0);

  // Init: hover capability, persisted enabled state, dark mode sync
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
    const saved = localStorage.getItem('cursor-enabled');
    if (saved !== null) setEnabled(saved === 'true');
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => { localStorage.setItem('cursor-enabled', String(enabled)); }, [enabled]);

  // L key + toggle-cursor event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'l') { e.preventDefault(); setEnabled(p => !p); }
    };
    const onToggle = () => setEnabled(p => !p);
    window.addEventListener('keydown', onKey);
    window.addEventListener('toggle-cursor', onToggle);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('toggle-cursor', onToggle);
    };
  }, []);

  // Hide system cursor when custom cursor is active
  useEffect(() => {
    if (!canHover) return;
    const styleId = 'custom-cursor-hide';
    if (enabled) {
      document.documentElement.style.cursor = 'none';
      document.body.style.cursor = 'none';
      if (!document.getElementById(styleId)) {
        const s = document.createElement('style');
        s.id = styleId;
        s.textContent = '*, *::before, *::after { cursor: none !important; }';
        document.head.appendChild(s);
      }
    } else {
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      document.getElementById(styleId)?.remove();
    }
    return () => {
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      document.getElementById(styleId)?.remove();
    };
  }, [enabled, canHover]);

  // Detect interactive elements under cursor
  const isInteractive = useCallback((el: Element | null): boolean => {
    if (!el) return false;
    if (['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true;
    const node = el as HTMLElement;
    if (node.getAttribute('role') === 'button') return true;
    if (window.getComputedStyle(node).cursor === 'pointer') return true;
    if (node.parentElement && window.getComputedStyle(node.parentElement).cursor === 'pointer') return true;
    return false;
  }, []);

  // Main RAF loop
  useEffect(() => {
    if (!canHover || !enabled) return;

    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      frameCount.current++;

      // Hover detection — throttled to every 3 frames
      if (frameCount.current % 3 === 0) {
        const should = isInteractive(document.elementFromPoint(mx, my));
        if (should !== hovering.current) {
          hovering.current = should;
          beaconRef.current?.classList.toggle('cur-hover', should);
        }
      }

      // Velocity for stretch/rotation
      const vx = mx - prevMouse.current.x;
      const vy = my - prevMouse.current.y;
      prevMouse.current = { x: mx, y: my };
      const speed = Math.hypot(vx, vy);
      const angle = speed > 1 ? Math.atan2(vy, vx) * (180 / Math.PI) : 0;

      // LERP each element toward mouse
      pinkPos.current.x   = LERP(pinkPos.current.x,   mx, 0.06);
      pinkPos.current.y   = LERP(pinkPos.current.y,   my, 0.06);
      whitePos.current.x  = LERP(whitePos.current.x,  mx, 0.14);
      whitePos.current.y  = LERP(whitePos.current.y,  my, 0.14);
      bluePos.current.x   = LERP(bluePos.current.x,   mx, 0.28);
      bluePos.current.y   = LERP(bluePos.current.y,   my, 0.28);
      beaconPos.current.x = LERP(beaconPos.current.x, mx, 0.14);
      beaconPos.current.y = LERP(beaconPos.current.y, my, 0.14);

      // Blue (fastest) elongates most; pink (slowest) barely stretches
      const stretchPink  = Math.min(1 + speed / 18, 2.0);
      const stretchWhite = Math.min(1 + speed / 11, 2.8);
      const stretchBlue  = Math.min(1 + speed / 7,  3.5);

      if (pinkRef.current)
        pinkRef.current.style.transform  = `translate(${pinkPos.current.x}px,${pinkPos.current.y}px) translate(-50%,-50%) rotate(${angle}deg) scaleX(${stretchPink})`;
      if (whiteRef.current)
        whiteRef.current.style.transform = `translate(${whitePos.current.x}px,${whitePos.current.y}px) translate(-50%,-50%) rotate(${angle}deg) scaleX(${stretchWhite})`;
      if (blueRef.current)
        blueRef.current.style.transform  = `translate(${bluePos.current.x}px,${bluePos.current.y}px) translate(-50%,-50%) rotate(${angle}deg) scaleX(${stretchBlue})`;
      if (beaconRef.current)
        beaconRef.current.style.transform = `translate(${beaconPos.current.x}px,${beaconPos.current.y}px) translate(-50%,-50%)`;

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [canHover, enabled, isInteractive]);

  if (!canHover || !enabled) return null;

  const dark = isDark;

  return (
    <>
      {/* Chromatic aberration trail — three dots at different LERP speeds */}
      <div ref={pinkRef}  aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: 7,  height: 7,  borderRadius: '50%', background: 'rgba(255,182,193,0.88)', filter: 'blur(0.6px)', pointerEvents: 'none', zIndex: 9999 }} />
      <div ref={whiteRef} aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: 5,  height: 5,  borderRadius: '50%', background: 'rgba(255,255,255,0.92)', filter: 'blur(0.4px)', pointerEvents: 'none', zIndex: 9999 }} />
      <div ref={blueRef}  aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: 6,  height: 6,  borderRadius: '50%', background: 'rgba(173,216,230,0.88)', filter: 'blur(0.6px)', pointerEvents: 'none', zIndex: 9999 }} />

      {/* Beacon ring — always visible, dissolves on interactive hover */}
      <div ref={beaconRef} aria-hidden="true" className="beacon-cursor" style={{
        position: 'fixed', top: 0, left: 0,
        width: 36, height: 36,
        borderRadius: '50%',
        border: dark ? '1px solid rgba(210,191,214,0.72)' : '1px solid rgba(58,32,52,0.48)',
        pointerEvents: 'none', zIndex: 9998,
        boxShadow: dark
          ? '0 0 0 5px rgba(255,182,193,0.07), 0 0 16px 3px rgba(210,191,214,0.18), 0 0 36px 8px rgba(173,216,230,0.09)'
          : '0 0 0 5px rgba(160,80,110,0.06), 0 0 14px 3px rgba(130,60,90,0.10), 0 0 30px 8px rgba(100,40,70,0.06)',
      }}>
        <div className="beacon-dot" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 4, height: 4, borderRadius: '50%',
          background: dark ? 'rgba(255,255,255,0.9)' : 'rgba(58,32,52,0.75)',
          transform: 'translate(-50%,-50%)',
        }} />
      </div>

      <style>{`
        .beacon-cursor {
          transition: border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease;
        }
        .beacon-cursor.cur-hover {
          border-color: transparent !important;
          box-shadow: none !important;
          opacity: 0 !important;
        }
        .beacon-dot { transition: opacity 0.35s ease; }
        .beacon-cursor.cur-hover .beacon-dot { opacity: 0 !important; }
      `}</style>
    </>
  );
}
