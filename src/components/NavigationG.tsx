/**
 * NavigationG — Liquid Iris overlay, Drift & Dissolve sparkles.
 * Light mode: blush-pink / lavender frosted glass, dark text.
 * Dark mode: deep indigo-black, white text.
 */

import { useState, useEffect, useCallback } from 'react';

const SECTIONS = [
  { id: 'hero',       label: 'home',     key: 'H' },
  { id: 'about',      label: 'about',    key: 'A' },
  { id: 'projects',   label: 'work',     key: 'P' },
  { id: 'gastronomy', label: 'gastro',   key: 'G' },
  { id: 'memories',   label: 'memories', key: 'M' },
] as const;

// Sparkle nodes: [top%, left%, size, animDelay, streakAngle, driftX, driftY]
const SPARKLES: [string, string, number, number, number, number, number][] = [
  ['7%',  '9%',  22, 0,   15,  35, -28],
  ['13%', '80%', 15, 0.9, -22, -42, 20],
  ['24%', '48%', 19, 1.4,  8,  28,  38],
  ['33%', '91%', 12, 0.5,  38, -30, -35],
  ['41%', '4%',  17, 2.1, -12,  45,  15],
  ['52%', '65%', 24, 0.7,  28, -20,  42],
  ['60%', '28%', 11, 1.7, -35,  38, -40],
  ['70%', '85%', 18, 0.2,  12, -25,  30],
  ['80%', '17%', 14, 1.3,  42,  30, -22],
  ['88%', '57%', 16, 0.6, -18, -38,  18],
  ['28%', '22%', 13, 2.3,  22,  22,  45],
  ['65%', '44%', 21, 0.4,  -8, -35, -25],
];

export default function NavigationG() {
  const [isOpen, setIsOpen]               = useState(false);
  const [isDark, setIsDark]               = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [linksVisible, setLinksVisible]   = useState(false);

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    SECTIONS.forEach(({ id }) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setLinksVisible(true), 420);
      return () => clearTimeout(t);
    }
    setLinksVisible(false);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  const navigate = useCallback((id: string) => {
    setIsOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 400);
  }, []);

  // Theme tokens
  const dark = isDark;
  const overlayBg       = dark ? 'rgba(8,9,14,0.97)' : 'linear-gradient(135deg,rgba(255,228,238,0.92) 0%,rgba(245,232,255,0.93) 45%,rgba(224,236,255,0.91) 100%)';
  const overlayBlur     = dark ? 'blur(24px)' : 'blur(44px) saturate(1.9)';
  const linkActive      = dark ? '#fff'                     : '#0c0516';
  const linkInactive    = dark ? 'rgba(255,255,255,0.28)'   : 'rgba(18,8,32,0.32)';
  const keyCol          = dark ? 'rgba(255,255,255,0.22)'   : 'rgba(18,8,32,0.22)';
  const creditCol       = dark ? 'rgba(255,255,255,0.13)'   : 'rgba(18,8,32,0.18)';
  const armH            = dark ? 'linear-gradient(to right,transparent,rgba(255,255,255,0.95),transparent)' : 'linear-gradient(to right,transparent,#fff,transparent)';
  const armV            = dark ? 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.95),transparent)' : 'linear-gradient(to bottom,transparent,#fff,transparent)';
  const streakGrad      = dark
    ? 'linear-gradient(to bottom,rgba(255,182,193,0.7),rgba(210,191,214,0.5),rgba(173,216,230,0.7),transparent)'
    : 'linear-gradient(to bottom,rgba(255,155,185,0.6),rgba(195,160,230,0.5),rgba(150,195,240,0.6),transparent)';

  return (
    <>
      <style>{`
        @keyframes drift-fade {
          0%   { opacity:0; transform:translate(0,0); }
          15%  { opacity:0.9; }
          85%  { opacity:0.6; }
          100% { opacity:0; transform:translate(var(--dx),var(--dy)); }
        }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position:'fixed', top:'24px', left:'24px', zIndex:70,
          width:'38px', height:'38px', borderRadius:'50%',
          border:'1px solid var(--surface-border)',
          background:'var(--nav-logo-bg)', backdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:'var(--nav-text)',
          transition:'border-color 0.2s ease,background 0.2s ease',
        }}
      >
        <div style={{ position:'relative', width:'15px', height:'15px' }}>
          <svg style={{ position:'absolute', inset:0, opacity:dark?1:0, transition:'opacity 0.3s' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg style={{ position:'absolute', inset:0, opacity:dark?0:1, transition:'opacity 0.3s' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </div>
      </button>

      {/* ST monogram */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        style={{
          position:'fixed', top:'24px', right:'24px', zIndex:80,
          width:'38px', height:'38px', borderRadius:'50%',
          border:`1px solid ${isOpen ? (dark?'rgba(255,255,255,0.25)':'rgba(18,8,32,0.2)') : 'var(--nav-logo-border)'}`,
          background:isOpen ? (dark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.35)') : 'var(--nav-logo-bg)',
          backdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', fontFamily:'var(--font-accent)',
          fontSize:'11px', fontWeight:700, letterSpacing:'0.05em',
          color:isOpen ? (dark?'#fff':'#0c0516') : 'var(--nav-text)',
          transition:'border-color 0.3s ease,background 0.3s ease,color 0.3s ease',
        }}
      >
        {isOpen
          ? <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          : 'ST'}
      </button>

      {/* Prism halo — blooms just ahead of the iris edge */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:73, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{
          position:'absolute', right:'24px', top:'24px',
          width:'38px', height:'38px', borderRadius:'50%',
          background: dark
            ? 'radial-gradient(circle,rgba(210,191,214,0.3) 0%,rgba(173,216,230,0.15) 50%,transparent 70%)'
            : 'radial-gradient(circle,rgba(255,200,220,0.5) 0%,rgba(210,180,240,0.3) 50%,transparent 70%)',
          filter:'blur(20px)',
          transformOrigin:'center',
          transform: isOpen ? 'scale(65)' : 'scale(0)',
          transition:'transform 0.62s cubic-bezier(0.76,0,0.24,1)',
        }}/>
      </div>

      {/* Full-screen overlay */}
      <div
        aria-hidden={!isOpen}
        style={{
          position:'fixed', inset:0, zIndex:75,
          background:overlayBg,
          backdropFilter:overlayBlur, WebkitBackdropFilter:overlayBlur,
          clipPath: isOpen ? 'circle(150% at calc(100% - 43px) 43px)' : 'circle(0% at calc(100% - 43px) 43px)',
          transition:'clip-path 0.72s cubic-bezier(0.76,0,0.24,1)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          pointerEvents: isOpen ? 'auto' : 'none',
          overflow:'hidden',
        }}
      >
        {/* Drift & Dissolve sparkles */}
        <div aria-hidden="true" style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {SPARKLES.map(([top, left, size, delay, angle, dx, dy], i) => (
            <div key={i} style={{
              position:'absolute', top, left,
              width:`${size}px`, height:`${size}px`,
              animation:`drift-fade ${6+(i%4)*1.2}s ease-in-out infinite`,
              animationDelay:`${delay}s`,
              '--dx':`${dx}px`, '--dy':`${dy}px`,
            } as React.CSSProperties}>
              <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'1px', background:armV, transform:'translateX(-50%)', filter:'blur(0.4px)' }}/>
              <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'1px', background:armH, transform:'translateY(-50%)', filter:'blur(0.4px)' }}/>
              <div style={{ position:'absolute', left:'50%', top:'50%', width:'2px', height:`${size*2.5}px`, background:streakGrad, transform:`translate(-50%,-50%) rotate(${angle}deg)`, filter:'blur(0.8px)', borderRadius:'1px' }}/>
              <div style={{ position:'absolute', left:'50%', top:'50%', width:'4px', height:'4px', borderRadius:'50%', background:'rgba(255,255,255,0.95)', transform:'translate(-50%,-50%)', filter:'blur(1.2px)' }}/>
            </div>
          ))}
        </div>

        {/* Nav links */}
        <nav aria-label="Full-screen navigation" style={{ position:'relative', zIndex:2 }}>
          <ul style={{ listStyle:'none', margin:0, padding:0, textAlign:'center' }}>
            {SECTIONS.map(({ id, label, key }, i) => {
              const active = activeSection === id;
              return (
                <li key={id} style={{
                  transform: linksVisible ? 'translateY(0)' : 'translateY(28px)',
                  opacity: linksVisible ? 1 : 0,
                  transition:`transform 0.65s cubic-bezier(0.16,1,0.3,1) ${i*65}ms,opacity 0.5s ease ${i*65}ms`,
                }}>
                  <button
                    onClick={() => navigate(id)}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      fontFamily:'var(--font-display)',
                      fontSize:'clamp(2.8rem,7vw,5.5rem)',
                      fontWeight:200, letterSpacing:'-0.03em', lineHeight:1.08,
                      color: active ? linkActive : linkInactive,
                      transition:'color 0.25s ease,letter-spacing 0.3s ease',
                      padding:'2px 28px',
                      display:'flex', alignItems:'center', gap:'18px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color=linkActive; (e.currentTarget as HTMLElement).style.letterSpacing='-0.01em'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color=active?linkActive:linkInactive; (e.currentTarget as HTMLElement).style.letterSpacing='-0.03em'; }}
                  >
                    <span style={{ fontFamily:'var(--font-accent)', fontSize:'9px', fontWeight:600, letterSpacing:'0.14em', color:keyCol, width:'16px', textAlign:'right', flexShrink:0, paddingTop:'7px' }}>{key}</span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <p style={{
          position:'relative', zIndex:2, marginTop:'52px',
          fontFamily:'var(--font-accent)', fontSize:'9px',
          letterSpacing:'0.16em', color:creditCol, textTransform:'uppercase',
          opacity: linksVisible ? 1 : 0,
          transition:`opacity 0.5s ease ${SECTIONS.length*65+120}ms`,
        }}>
          d · theme &ensp;·&ensp; ? · shortcuts &ensp;·&ensp; e · <span style={{opacity:0.45}}>n-back (coming soon)</span>
        </p>

        <p style={{
          position:'absolute', bottom:'32px', left:0, right:0, textAlign:'center', zIndex:2,
          fontFamily:'var(--font-accent)', fontSize:'10px',
          letterSpacing:'0.12em', color:creditCol, textTransform:'uppercase',
          opacity: linksVisible ? 1 : 0, transition:'opacity 0.5s ease 600ms',
        }}>
          sandria tran · portfolio
        </p>
      </div>
    </>
  );
}
