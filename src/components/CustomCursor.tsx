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

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onEnterInteractive = () => {
      ringRef.current?.classList.add('cursor-hover');
      dotRef.current?.classList.add('cursor-hover');
    };
    const onLeaveInteractive = () => {
      ringRef.current?.classList.remove('cursor-hover');
      dotRef.current?.classList.remove('cursor-hover');
    };

    const addInteractiveListeners = () => {
      document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    };

    window.addEventListener('mousemove', onMove);
    addInteractiveListeners();

    const observer = new MutationObserver(() => addInteractiveListeners());
    observer.observe(document.body, { childList: true, subtree: true });

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
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
      observer.disconnect();
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
