/**
 * Navigation — "The Dynamic Notch" (React Island)
 * App-like interaction, expanding pill based on hover/scroll context.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const SECTIONS = [
  { id: 'hero', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'projects', label: 'work' },
  { id: 'gastronomy', label: 'gastronomy' },
  { id: 'memories', label: 'memories' },
] as const;

function Logo({ theme }: { theme: "light" | "dark" }) {
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

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isDark, setIsDark] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

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

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Expand at the very top, otherwise expand on scroll UP and collapse on scroll DOWN
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

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  // The notch is "open" if forced by scroll, or if the user is hovering it.
  const isOpen = isExpanded || isHovered;

  return (
    <div className="fixed top-6 left-1/2 z-[60] -translate-x-1/2" style={{ pointerEvents: 'none' }}>
      <nav
        className="flex items-center gap-2 rounded-[2rem] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid var(--nav-border)',
          boxShadow: 'var(--nav-shadow)',
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="navigation"
        aria-label="Main navigation"
      >
        
        {/* Left: ST Logo Badge */}
        <Logo theme={isDark ? 'dark' : 'light'} />

        {/* Center: Dynamic Expansion Container */}
        <div 
          className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center font-accent uppercase tracking-wider text-xs font-semibold"
          style={{ width: isOpen ? `${SECTIONS.length * 86}px` : '74px' }}
        >
          {isOpen ? (
            /* Expanded State: Links with animated segmented control pill */
            <div className="relative flex w-full justify-evenly items-center animate-fade-in px-1">
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
                  {/* Active highlight pill */}
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
            /* Collapsed State: "Menu =" Indicator */
            <div className="flex w-full cursor-pointer items-center justify-center gap-2 animate-fade-in text-[var(--nav-text)] transition-colors hover:text-[var(--text-primary)]">
              <span>Menu</span>
              <span className="flex flex-col gap-[3px]">
                <span className="h-[2px] w-3 rounded-full bg-currentColor" style={{ background: 'currentColor' }} />
                <span className="h-[2px] w-3 rounded-full bg-currentColor" style={{ background: 'currentColor' }} />
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Hotkey Toggle */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-shortcuts'))}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--nav-logo-bg)] focus-visible:outline-2 focus-visible:outline-[var(--text-primary)]"
            style={{ color: 'var(--nav-text)' }}
            aria-label="Keyboard Shortcuts"
          >
            <span className="font-accent text-sm font-bold opacity-80 transition-opacity group-hover:opacity-100">?</span>
          </button>

          {/* Theme Toggle */}
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
      
      <style>{`
        .animate-fade-in {
          animation: fadein 0.3s ease-in forwards;
        }
        @keyframes fadein {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
