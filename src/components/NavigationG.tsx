/**
 * NavigationG — "Smart Pill Bar" (React Island)
 * Desktop (>=768px): Same dynamic notch as Navigation.tsx
 * Mobile (<768px): Fixed bottom bar with scrollable text pills + pinned theme toggle
 *   - Long-press / double-tap on any pill opens a shortcuts popover
 *   - Active pill auto-scrolls into center view
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const SECTIONS = [
  { id: 'hero', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'projects', label: 'work' },
  { id: 'gastronomy', label: 'gastro' },
  { id: 'memories', label: 'memories' },
] as const;

const SHORTCUT_KEYS = [
  { key: 'D', label: 'theme', eventKey: 'd' },
  { key: 'S', label: 'spot', eventKey: 's' },
  { key: 'L', label: 'cursor', eventKey: 'l' },
  { key: '?', label: 'help', eventKey: '?' },
] as const;

function Logo({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <a
      href="#hero"
      aria-label="Sandria Tran home"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-accent text-xs font-bold tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-[var(--text-primary)]"
      style={{
        borderColor: 'var(--nav-logo-border)',
        background: 'var(--nav-logo-bg)',
        color: 'var(--nav-text)',
      }}
    >
      ST
    </a>
  );
}

export default function NavigationG() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isDark, setIsDark] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPopover, setShowPopover] = useState(false);
  const lastScrollY = useRef(0);
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef(0);
  const popoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init theme
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Scroll-based expand/collapse for desktop nav
  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setIsExpanded(true);
      } else {
        setIsExpanded(currentScrollY < lastScrollY.current);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll active pill into view on mobile
  useEffect(() => {
    const pill = pillRefs.current[activeSection];
    if (pill && pillContainerRef.current) {
      pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeSection]);

  // Auto-close popover after 3 seconds
  useEffect(() => {
    if (showPopover) {
      popoverTimeout.current = setTimeout(() => setShowPopover(false), 3000);
      return () => {
        if (popoverTimeout.current) clearTimeout(popoverTimeout.current);
      };
    }
  }, [showPopover]);

  // Close popover on tap outside
  useEffect(() => {
    if (!showPopover) return;
    const handleTap = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popover]')) {
        setShowPopover(false);
      }
    };
    document.addEventListener('touchstart', handleTap, { passive: true });
    document.addEventListener('mousedown', handleTap);
    return () => {
      document.removeEventListener('touchstart', handleTap);
      document.removeEventListener('mousedown', handleTap);
    };
  }, [showPopover]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const openPopover = useCallback(() => {
    setShowPopover(true);
  }, []);

  // Long-press handlers
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      openPopover();
    }, 500);
  }, [openPopover]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Double-tap handler
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      openPopover();
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
    }
  }, [openPopover]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const dispatchShortcut = useCallback((key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    setShowPopover(false);
  }, []);

  const isOpen = isExpanded || isHovered;
  const isOnHero = activeSection === 'hero';

  return (
    <>
      {/* ===== DESKTOP NAV (>=768px) — Same as Navigation.tsx ===== */}
      <div
        className="fixed top-6 left-1/2 z-[60] -translate-x-1/2 hidden md:block"
        style={{ pointerEvents: 'none' }}
      >
        <nav
          className="flex items-center gap-2 rounded-[2rem] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid var(--nav-border)',
            boxShadow: 'var(--nav-shadow)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="navigation"
          aria-label="Main navigation"
        >
          <Logo theme={isDark ? 'dark' : 'light'} />

          <div
            className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center font-accent uppercase tracking-wider text-xs font-semibold"
            style={{ width: isOpen ? `${SECTIONS.length * 86}px` : '74px' }}
          >
            {isOpen ? (
              <div className="relative flex w-full justify-evenly items-center navg-fade-in px-1">
                {SECTIONS.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="relative z-10 px-3 py-1.5 transition-colors duration-300 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]"
                    style={{
                      color: activeSection === id ? 'var(--nav-active-text)' : 'var(--nav-text)',
                    }}
                  >
                    {label}
                    {activeSection === id && (
                      <span
                        className="absolute inset-0 -z-10 rounded-full transition-all duration-300"
                        style={{ background: 'var(--nav-active-pill)' }}
                      />
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex w-full cursor-pointer items-center justify-center gap-2 navg-fade-in text-[var(--nav-text)] transition-colors hover:text-[var(--text-primary)]">
                <span>Menu</span>
                <span className="flex flex-col gap-[3px]">
                  <span className="h-[2px] w-3 rounded-full" style={{ background: 'currentColor' }} />
                  <span className="h-[2px] w-3 rounded-full" style={{ background: 'currentColor' }} />
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-shortcuts'))}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--nav-logo-bg)] focus-visible:outline-2 focus-visible:outline-[var(--text-primary)]"
              style={{ color: 'var(--nav-text)' }}
              aria-label="Keyboard Shortcuts"
            >
              <span className="font-accent text-sm font-bold opacity-80 transition-opacity group-hover:opacity-100">?</span>
            </button>

            <button
              onClick={toggleTheme}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--nav-logo-bg)] focus-visible:outline-2 focus-visible:outline-[var(--text-primary)]"
              style={{ color: 'var(--nav-text)' }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative h-4 w-4">
                <svg
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ opacity: isDark ? 1 : 0 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <svg
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ opacity: isDark ? 0 : 1 }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* ===== MOBILE NAV (<768px) — Fixed bottom pill bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
        {/* Shortcuts Popover */}
        {showPopover && (
          <div
            data-popover
            className="navg-popover-enter flex items-center justify-center pb-2"
            style={{ transformOrigin: 'bottom center' }}
          >
            <div
              className="flex items-center gap-2 rounded-xl"
              style={{
                padding: '8px 12px',
                background: 'var(--nav-bg)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid var(--nav-border)',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
              }}
            >
              {SHORTCUT_KEYS.map(({ key, label, eventKey }) => (
                <button
                  key={key}
                  onClick={() => dispatchShortcut(eventKey)}
                  className="flex h-8 w-8 items-center justify-center rounded-full font-accent text-xs font-bold transition-colors"
                  style={{
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--nav-text)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }}
                  aria-label={label}
                  title={label}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <nav
          className="flex items-center transition-opacity duration-300"
          style={{
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderTop: '1px solid var(--nav-border)',
            padding: '8px 12px',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
            opacity: isOnHero ? 0.6 : 1,
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Scrollable pills */}
          <div
            ref={pillContainerRef}
            className="navg-hide-scrollbar flex flex-1 items-center gap-[6px] overflow-x-auto"
          >
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                ref={(el) => { pillRefs.current[id] = el; }}
                onClick={() => {
                  scrollToSection(id);
                  handleTap();
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onContextMenu={handleContextMenu}
                className="shrink-0 rounded-full font-accent font-semibold uppercase transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]"
                style={{
                  padding: '7px 18px',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  background: activeSection === id ? 'var(--nav-active-pill)' : 'transparent',
                  color: activeSection === id ? 'var(--nav-active-text)' : 'var(--nav-text)',
                }}
                aria-current={activeSection === id ? 'true' : undefined}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div
            className="mx-2 self-stretch"
            style={{
              width: '1px',
              background: 'var(--surface-border)',
              flexShrink: 0,
            }}
          />

          {/* Pinned theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-full transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]"
            style={{
              width: '36px',
              height: '36px',
              flexShrink: 0,
              color: 'var(--nav-text)',
            }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="text-base leading-none">{isDark ? '☀' : '☾'}</span>
          </button>
        </nav>
      </div>

      {/* Styles */}
      <style>{`
        .navg-fade-in {
          animation: navg-fadein 0.3s ease-in forwards;
        }
        @keyframes navg-fadein {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        .navg-hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .navg-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .navg-popover-enter {
          animation: navg-popover-in 0.2s ease-out forwards;
        }
        @keyframes navg-popover-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
