import { useRef, useEffect, useState } from 'react';

const LERP_RING = 0.12;
const LERP_DOT = 0.25;

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number>(0);
  const [canHover, setCanHover] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Load saved preference or default to true
  useEffect(() => {
    const saved = localStorage.getItem('cursor-enabled');
    if (saved !== null) {
      setEnabled(saved === 'true');
    }
  }, []);

  // Save preference whenever it changes
  useEffect(() => {
    localStorage.setItem('cursor-enabled', String(enabled));
  }, [enabled]);

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  // Listen for hotkey toggle (L key)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setEnabled(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);

    const onToggle = () => setEnabled(prev => !prev);
    window.addEventListener('toggle-cursor', onToggle);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('toggle-cursor', onToggle);
    };
  }, []);

  // Hide/show default system cursor when custom cursor is toggled
  useEffect(() => {
    if (!canHover) return;
    if (enabled) {
      document.documentElement.style.cursor = 'none';
      document.body.style.cursor = 'none';
      const style = document.createElement('style');
      style.id = 'custom-cursor-hide';
      style.textContent = '*, *::before, *::after { cursor: none !important; }';
      document.head.appendChild(style);
    } else {
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      document.getElementById('custom-cursor-hide')?.remove();
    }
    return () => {
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
      document.getElementById('custom-cursor-hide')?.remove();
    };
  }, [enabled, canHover]);

  useEffect(() => {
    if (!canHover || !enabled) return;

    // Use event delegation — check if hovered element is interactive
    const isInteractive = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      const node = el as HTMLElement;
      if (node.getAttribute('role') === 'button') return true;
      if (node.tabIndex >= 0 && node.tabIndex !== -1) return true;
      if (node.style?.cursor === 'pointer') return true;
      const computed = window.getComputedStyle(node);
      if (computed.cursor === 'pointer') return true;
      // Check parent (for cases like img inside a figure with cursor:pointer)
      if (el.parentElement && el.parentElement !== document.body) {
        const parentComputed = window.getComputedStyle(el.parentElement);
        if (parentComputed.cursor === 'pointer') return true;
      }
      return false;
    };

    let hovering = false;
    let hoverCheckFrame = 0;
    const onMoveWithHover = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      // Throttle elementFromPoint to every 3rd frame to avoid layout thrashing
      hoverCheckFrame++;
      if (hoverCheckFrame % 3 !== 0) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const shouldHover = isInteractive(target);

      if (shouldHover && !hovering) {
        hovering = true;
        ringRef.current?.classList.add('cursor-hover');
        dotRef.current?.classList.add('cursor-hover');
      } else if (!shouldHover && hovering) {
        hovering = false;
        ringRef.current?.classList.remove('cursor-hover');
        dotRef.current?.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('mousemove', onMoveWithHover);

    const animate = () => {
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (!ring || !dot) { rafId.current = requestAnimationFrame(animate); return; }

      ringPos.current.x += (mouse.current.x - ringPos.current.x) * LERP_RING;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * LERP_RING;
      dotPos.current.x += (mouse.current.x - dotPos.current.x) * LERP_DOT;
      dotPos.current.y += (mouse.current.y - dotPos.current.y) * LERP_DOT;

      ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${dotPos.current.x}px, ${dotPos.current.y}px) translate(-50%, -50%)`;

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMoveWithHover);
      cancelAnimationFrame(rafId.current);
    };
  }, [canHover, enabled]);

  if (!canHover) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-follower" aria-hidden="true" style={{ display: enabled ? 'block' : 'none' }} />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" style={{ display: enabled ? 'block' : 'none' }} />
    </>
  );
}
